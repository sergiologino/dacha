import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { hasFullAccess, isTrialActive, trialEndDate } from "@/lib/user-access";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { enable } = await request.json();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isPremium: !!enable },
      select: { isPremium: true },
    });

    return NextResponse.json({ isPremium: updated.isPremium });
  } catch (err) {
    console.error("Premium toggle error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

    const full = hasFullAccess(user);
    return NextResponse.json({
      isPremium: user.isPremium,
      /** Полный функционал: оплаченный Премиум или 14 дней с регистрации. */
      hasFullAccess: full,
      trialActive: isTrialActive(user),
      trialEndsAt: user.isPremium ? null : trialEndDate(user.createdAt).toISOString(),
      isAdmin,
    });
  } catch (err) {
    console.error("Premium GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
