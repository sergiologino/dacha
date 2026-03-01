import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      isPremium: true,
      _count: {
        select: {
          beds: true,
          plants: true,
        },
      },
    },
  });

  const userIds = users.map((u) => u.id);

  const succeededPayments = await prisma.payment.findMany({
    where: { userId: { in: userIds }, status: "succeeded" },
    orderBy: { createdAt: "asc" },
    select: { userId: true, createdAt: true },
  });
  const paymentByUser = new Map<string, Date>();
  for (const p of succeededPayments) {
    if (!paymentByUser.has(p.userId)) paymentByUser.set(p.userId, p.createdAt);
  }

  const aiCounts = await prisma.aiCallLog.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds, not: null } },
    _count: { id: true },
  });
  const aiByUser = new Map(aiCounts.map((c) => [c.userId!, c._count.id]));

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    name: u.name ?? null,
    createdAt: u.createdAt.toISOString(),
    firstPaymentAt: paymentByUser.get(u.id)?.toISOString() ?? null,
    isPremium: u.isPremium,
    bedsCount: u._count.beds,
    plantsCount: u._count.plants,
    aiRequestsCount: aiByUser.get(u.id) ?? 0,
  }));

  return NextResponse.json({ users: rows });
}
