import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

function yookassaAuth() {
  if (!shopId || !secretKey) return null;
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

function addPremiumMonths(from: Date, plan: string): Date {
  if (plan === "yearly") {
    return new Date(from.getFullYear() + 1, from.getMonth(), from.getDate());
  }
  return new Date(from.getFullYear(), from.getMonth() + 1, from.getDate());
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
        const premiumUntil = addPremiumMonths(now, payment.plan);
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
      const items = listData.items ?? [];
      const succeeded = items.find(
        (p: { status?: string; metadata?: { userId?: string } }) =>
          (p.status === "succeeded" || p.status === "waiting_for_capture") &&
          p.metadata?.userId === user.email
      );
      if (succeeded) {
        const plan = (succeeded.metadata?.plan as string) || "yearly";
        const premiumUntil = addPremiumMonths(new Date(), plan);
        await prisma.user.update({
          where: { id: user.id },
          data: { isPremium: true, premiumUntil },
        });
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
