import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.trim() : null;
  if (!path || path.length > 500) {
    return NextResponse.json({ error: "path required (max 500 chars)" }, { status: 400 });
  }

  await prisma.pageVisit.upsert({
    where: {
      userId_path: { userId: user.id, path },
    },
    create: {
      userId: user.id,
      path,
      visitCount: 1,
      lastVisitedAt: new Date(),
    },
    update: {
      visitCount: { increment: 1 },
      lastVisitedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
