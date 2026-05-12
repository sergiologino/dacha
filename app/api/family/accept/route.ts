import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { tryRemoveStoredFile } from "@/lib/photo-storage";

export const dynamic = "force-dynamic";

function parseInviteToken(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const token = parseInviteToken(body.token);
    if (!token) {
      return NextResponse.json({ error: "Код приглашения не найден." }, { status: 400 });
    }

    if (user.familyOwnerId) {
      return NextResponse.json(
        { error: "Этот аккаунт уже подключён к семейному доступу." },
        { status: 409 }
      );
    }

    const owner = await prisma.user.findFirst({
      where: {
        familyInviteToken: token,
        familyInviteExpiresAt: { gt: new Date() },
      },
      select: { id: true, name: true, email: true, phone: true },
    });
    if (!owner) {
      return NextResponse.json({ error: "Приглашение не найдено или уже истекло." }, { status: 404 });
    }
    if (owner.id === user.id) {
      return NextResponse.json({ error: "Нельзя принять собственное приглашение." }, { status: 400 });
    }

    const photoRows = await prisma.photo.findMany({
      where: { userId: user.id },
      select: { url: true },
    });
    for (const { url } of photoRows) {
      await tryRemoveStoredFile(url);
    }

    await prisma.$transaction([
      prisma.analysis.deleteMany({ where: { userId: user.id } }),
      prisma.photo.deleteMany({ where: { userId: user.id } }),
      prisma.plant.deleteMany({ where: { userId: user.id } }),
      prisma.bed.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          familyOwnerId: owner.id,
          onboardingDone: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      owner,
    });
  } catch (error) {
    console.error("Family accept error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
