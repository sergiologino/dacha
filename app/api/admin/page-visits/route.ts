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

  const visits = await prisma.pageVisit.findMany({
    orderBy: [{ path: "asc" }, { visitCount: "desc" }],
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const byPath = visits.reduce(
    (acc, v) => {
      const key = v.path;
      if (!acc[key]) acc[key] = { path: key, totalVisits: 0, uniqueUsers: 0, rows: [] };
      acc[key].totalVisits += v.visitCount;
      acc[key].uniqueUsers += 1;
      acc[key].rows.push({
        userEmail: v.user?.email ?? null,
        userName: v.user?.name ?? null,
        visitCount: v.visitCount,
        lastVisitedAt: v.lastVisitedAt.toISOString(),
      });
      return acc;
    },
    {} as Record<
      string,
      { path: string; totalVisits: number; uniqueUsers: number; rows: { userEmail: string | null; userName: string | null; visitCount: number; lastVisitedAt: string }[] }
    >
  );

  const summary = Object.values(byPath).map((s) => ({
    path: s.path,
    totalVisits: s.totalVisits,
    uniqueUsers: s.uniqueUsers,
    topVisitors: s.rows
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 10)
      .map((r) => ({ userEmail: r.userEmail, userName: r.userName, visitCount: r.visitCount, lastVisitedAt: r.lastVisitedAt })),
  }));

  return NextResponse.json({
    summary: summary.sort((a, b) => b.totalVisits - a.totalVisits),
    raw: visits.map((v) => ({
      path: v.path,
      userEmail: v.user?.email ?? null,
      visitCount: v.visitCount,
      lastVisitedAt: v.lastVisitedAt.toISOString(),
    })),
  });
}
