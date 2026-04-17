import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import {
  hasFullAccess,
  isLegacyFreeTierUser,
  LEGACY_FREE_CHAT_LIMIT,
} from "@/lib/user-access";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  let freeLeft: number;
  if (hasFullAccess(user)) {
    freeLeft = -1;
  } else if (isLegacyFreeTierUser(user)) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthUserMessages = await prisma.chatMessage.count({
      where: {
        userId: user.id,
        role: "user",
        createdAt: { gte: monthStart },
      },
    });
    freeLeft = Math.max(0, LEGACY_FREE_CHAT_LIMIT - thisMonthUserMessages);
  } else {
    freeLeft = 0;
  }

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.createdAt.toISOString(),
    })),
    freeLeft,
  });
}

export async function DELETE() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.chatMessage.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
