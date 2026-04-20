import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSessionEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Все незавершённые задачи очереди (зеркало клиентских outbox) — только админ. */
export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAdminSessionEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasks = await prisma.taskQueue.findMany({
    where: {
      status: { in: ["pending", "failed"] },
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      id: t.id,
      clientLocalId: t.clientLocalId,
      userId: t.userId,
      userEmail: t.user.email,
      userPhone: t.user.phone,
      userName: t.user.name,
      action: t.action,
      payload: t.payload,
      status: t.status,
      retries: t.retries,
      errorMsg: t.errorMsg,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
