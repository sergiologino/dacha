import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";
import {
  getSubscriptionPlanAmount,
  getSubscriptionPlanDescription,
  getSubscriptionPlanReceiptDescription,
  getYearlyPromoExtraMonthsForPlan,
  normalizeSubscriptionPlan,
} from "@/lib/subscription-plans";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid payment request body" },
      { status: 400 }
    );
  }

  const raw = body as { amount?: unknown; description?: unknown; plan?: unknown };
  const plan = normalizeSubscriptionPlan(raw.plan);
  const amountNum = getSubscriptionPlanAmount(plan);
  const requestedAmount = Number(raw.amount);
  if (!Number.isFinite(requestedAmount) || Math.round(requestedAmount) !== amountNum) {
    return NextResponse.json(
      { error: "Invalid amount" },
      { status: 400 }
    );
  }

  const description =
    typeof raw.description === "string" && raw.description.trim().length > 0
      ? raw.description
      : null;

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 500 }
    );
  }

  try {
    const idempotenceKey = crypto.randomUUID();
    const yearlyPromoExtraMonths =
      getYearlyPromoExtraMonthsForPlan(plan, user.createdAt, new Date());
    const paymentUserIdentifier = user.email ?? user.phone ?? user.id;

    const returnUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/garden?payment=success`;
    const receiptDescription =
      description ??
      getSubscriptionPlanReceiptDescription(plan, yearlyPromoExtraMonths);
    const paymentDescription =
      description ?? getSubscriptionPlanDescription(plan, yearlyPromoExtraMonths);

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: { value: amountNum.toFixed(2), currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: returnUrl,
        },
        description: paymentDescription,
        metadata: {
          plan,
          userId: paymentUserIdentifier,
          yearlyPromoExtraMonths: String(yearlyPromoExtraMonths),
        },
        receipt: user.email
          ? {
              customer: { email: user.email },
              items: [
                {
                  description: receiptDescription,
                  quantity: 1,
                  amount: { value: amountNum.toFixed(2), currency: "RUB" },
                  vat_code: 1,
                  payment_mode: "full_payment",
                  payment_subject: "service",
                },
              ],
            }
          : undefined,
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | {
          confirmation?: { confirmation_url?: string };
          id?: string;
          code?: string;
          description?: string;
        }
      | null;

    if (!response.ok) {
      const yookassaCode = data && typeof data.code === "string" ? data.code : "";
      const yookassaDesc =
        data && typeof data.description === "string" ? data.description : "";
      const safeMessage =
        yookassaDesc || yookassaCode || "Payment creation failed";
      console.error("[Payments] YooKassa error:", response.status, yookassaCode, yookassaDesc);
      return NextResponse.json(
        { error: safeMessage },
        { status: 500 }
      );
    }

    if (data?.confirmation?.confirmation_url && data.id) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          yookassaId: data.id,
          amount: Math.round(amountNum),
          plan,
          description: paymentDescription,
          status: "pending",
        },
      });
      return NextResponse.json({ paymentUrl: data.confirmation.confirmation_url });
    }

    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  } catch (e) {
    console.error("Payment creation error:", e);
    return NextResponse.json({ error: "Payment service error" }, { status: 500 });
  }
}
