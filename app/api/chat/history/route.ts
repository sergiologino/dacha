import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

const FREE_CHAT_LIMIT = 5;

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

  let freeLeft = FREE_CHAT_LIMIT;
  if (!user.isPremium) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthUserMessages = await prisma.chatMessage.count({
      where: {
        userId: user.id,
        role: "user",
        createdAt: { gte: monthStart },
      },
    });
    freeLeft = Math.max(0, FREE_CHAT_LIMIT - thisMonthUserMessages);
  } else {
    freeLeft = -1;
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
