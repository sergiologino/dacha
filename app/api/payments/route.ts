import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, description, plan } = await request.json();

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

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: { value: amount.toFixed(2), currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: `${request.nextUrl.origin}/garden?payment=success`,
        },
        description,
        metadata: { plan, userId: session.user.email },
      }),
    });

    const data = await response.json();

    if (data.confirmation?.confirmation_url) {
      return NextResponse.json({ paymentUrl: data.confirmation.confirmation_url });
    }

    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Payment service error" }, { status: 500 });
  }
}
