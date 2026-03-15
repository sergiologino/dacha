import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";
import {
  addMonthsPreservingDate,
  getPremiumDurationMonths,
  getYearlyPlanExtraMonths,
} from "@/lib/yearly-promo";

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

function yookassaAuth() {
  if (!shopId || !secretKey) return null;
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = yookassaAuth();
  if (!authHeader) {
    return NextResponse.json({ error: "Payment service not configured" }, { status: 500 });
  }

  const pending = await prisma.payment.findMany({
    where: { userId: user.id, status: "pending", yookassaId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  for (const payment of pending) {
    const yookassaId = payment.yookassaId!;
    try {
      const res = await fetch(`https://api.yookassa.ru/v3/payments/${yookassaId}`, {
        headers: { Authorization: authHeader },
      });
      const data = await res.json();
      if (data.status === "succeeded" || data.status === "waiting_for_capture") {
        const now = new Date();
        const premiumFrom =
          user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
        const durationMonths = getPremiumDurationMonths({
          plan: payment.plan as "monthly" | "yearly",
          createdAt: user.createdAt,
          purchasedAt: payment.createdAt,
        });
        const premiumUntil = addMonthsPreservingDate(premiumFrom, durationMonths);
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "succeeded" },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { isPremium: true, premiumUntil },
          }),
        ]);
        return NextResponse.json({ isPremium: true, activated: true });
      }
      if (data.status === "canceled" || data.status === "cancelled") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "canceled" },
        });
      }
    } catch (e) {
      console.error("YooKassa fetch payment error:", e);
    }
  }

  // Fallback: нет записей pending (платёж создан до сохранения в БД или с другой вкладки).
  // Пробуем взять список платежей ЮKassa и найти успешный по metadata.userId (email).
  if (pending.length === 0 && user.email) {
    try {
      const listRes = await fetch("https://api.yookassa.ru/v3/payments?limit=20", {
        headers: { Authorization: authHeader },
      });
      const listData = await listRes.json();
      const items = (listData.items ?? []) as Array<{
        id?: string;
        status?: string;
        created_at?: string;
        amount?: { value?: string };
        metadata?: {
          userId?: string;
          plan?: string;
          yearlyPromoExtraMonths?: string;
        };
      }>;
      const succeeded = items.find(
        (p) =>
          (p.status === "succeeded" || p.status === "waiting_for_capture") &&
          p.metadata?.userId === user.email
      );
      if (succeeded) {
        if (succeeded.id) {
          const existingPayment = await prisma.payment.findUnique({
            where: { yookassaId: succeeded.id },
            select: { status: true },
          });
          if (existingPayment?.status === "succeeded") {
            return NextResponse.json({ isPremium: true, activated: false });
          }
        }

        const plan = (succeeded.metadata?.plan as string) || "yearly";
        const promoExtraMonthsRaw = Number(
          (succeeded.metadata?.yearlyPromoExtraMonths as string | undefined) ?? NaN
        );
        const purchasedAt = new Date(
          (succeeded.created_at as string | undefined) ?? new Date().toISOString()
        );
        const durationMonths =
          plan === "yearly"
            ? 12 +
              (Number.isFinite(promoExtraMonthsRaw)
                ? promoExtraMonthsRaw
                : getYearlyPlanExtraMonths(user.createdAt, purchasedAt))
            : 1;
        const premiumFrom =
          user.premiumUntil && user.premiumUntil > new Date()
            ? user.premiumUntil
            : new Date();
        const premiumUntil = addMonthsPreservingDate(premiumFrom, durationMonths);
        const parsedAmount = Number(succeeded.amount?.value ?? NaN);
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { isPremium: true, premiumUntil },
          }),
          ...(succeeded.id
            ? [
                prisma.payment.upsert({
                  where: { yookassaId: succeeded.id },
                  create: {
                    userId: user.id,
                    yookassaId: succeeded.id,
                    amount: Number.isFinite(parsedAmount) ? Math.round(parsedAmount) : 0,
                    plan,
                    status: "succeeded",
                    description: null,
                  },
                  update: {
                    status: "succeeded",
                    plan,
                    amount: Number.isFinite(parsedAmount) ? Math.round(parsedAmount) : undefined,
                  },
                }),
              ]
            : []),
        ]);
        return NextResponse.json({ isPremium: true, activated: true });
      }
    } catch (e) {
      console.error("YooKassa list payments error:", e);
    }
  }

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isPremium: true },
  });
  return NextResponse.json({ isPremium: !!updated?.isPremium });
}
