import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export const dynamic = "force-dynamic";

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dateFromStr = searchParams.get("dateFrom");
  const dateToStr = searchParams.get("dateTo");

  const where: { createdAt?: { gte: Date; lte: Date } } = {};
  if (dateFromStr && dateToStr) {
    const from = new Date(dateFromStr);
    const to = new Date(dateToStr);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      where.createdAt = { gte: startOfDay(from), lte: endOfDay(to) };
    }
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const totalSucceeded = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCanceled = payments
    .filter((p) => p.status === "canceled")
    .reduce((sum, p) => sum + p.amount, 0);
  const countSucceeded = payments.filter((p) => p.status === "succeeded").length;
  const countCanceled = payments.filter((p) => p.status === "canceled").length;
  const countPending = payments.filter((p) => p.status === "pending").length;

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: p.id,
      userId: p.userId,
      userEmail: p.user?.email ?? null,
      userName: p.user?.name ?? null,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      plan: p.plan,
      description: p.description,
      yookassaId: p.yookassaId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    totals: {
      totalSucceeded,
      totalCanceled,
      countSucceeded,
      countCanceled,
      countPending,
    },
  });
}
