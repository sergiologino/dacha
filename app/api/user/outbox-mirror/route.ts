import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Зеркало клиентского outbox (IndexedDB) в TaskQueue для админки и учёта. */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const clientLocalId = typeof body.clientLocalId === "string" ? body.clientLocalId : "";
  if (!clientLocalId) {
    return NextResponse.json({ error: "clientLocalId required" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "unknown";
  const payload = body.payload ?? {};
  const status = typeof body.status === "string" ? body.status : "pending";

  await prisma.taskQueue.upsert({
    where: {
      userId_clientLocalId: {
        userId: user.id,
        clientLocalId,
      },
    },
    create: {
      userId: user.id,
      clientLocalId,
      action,
      payload,
      status: status === "failed" ? "failed" : "pending",
    },
    update: {
      action,
      payload,
      status: status === "failed" ? "failed" : "pending",
      errorMsg: null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const items = body.items;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  for (const raw of items) {
    const clientLocalId = typeof raw?.clientLocalId === "string" ? raw.clientLocalId : "";
    if (!clientLocalId) continue;
    const action = typeof raw?.action === "string" ? raw.action : "unknown";
    const payload = raw?.payload ?? {};
    const status = typeof raw?.status === "string" ? raw.status : "pending";
    await prisma.taskQueue.upsert({
      where: {
        userId_clientLocalId: {
          userId: user.id,
          clientLocalId,
        },
      },
      create: {
        userId: user.id,
        clientLocalId,
        action,
        payload,
        status: status === "failed" ? "failed" : "pending",
      },
      update: {
        action,
        payload,
        status: status === "failed" ? "failed" : "pending",
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const clientLocalId = typeof body.clientLocalId === "string" ? body.clientLocalId : "";
  if (!clientLocalId) {
    return NextResponse.json({ error: "clientLocalId required" }, { status: 400 });
  }

  const nextStatus = body.status === "completed" ? "completed" : "pending";

  await prisma.taskQueue.updateMany({
    where: {
      userId: user.id,
      clientLocalId,
    },
    data: {
      status: nextStatus,
      processedAt: nextStatus === "completed" ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientLocalId = request.nextUrl.searchParams.get("clientLocalId") ?? "";
  if (!clientLocalId) {
    return NextResponse.json({ error: "clientLocalId required" }, { status: 400 });
  }

  await prisma.taskQueue.updateMany({
    where: {
      userId: user.id,
      clientLocalId,
    },
    data: {
      status: "cancelled",
      processedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
