import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";

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
      if (data.status === "succeeded") {
        const now = new Date();
        const premiumUntil =
          payment.plan === "yearly"
            ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
            : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
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

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isPremium: true },
  });
  return NextResponse.json({ isPremium: !!updated?.isPremium });
}
