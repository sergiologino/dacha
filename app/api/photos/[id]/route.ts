import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const photo = await prisma.photo.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
      isPublic: true,
      publishedAt: true,
    },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const caption =
    body.caption === null || body.caption === undefined
      ? null
      : typeof body.caption === "string"
        ? body.caption.trim()
        : null;
  const isPublic =
    typeof body.isPublic === "boolean" ? body.isPublic : photo.isPublic;

  if (caption && caption.length > 280) {
    return NextResponse.json(
      { error: "Подпись слишком длинная" },
      { status: 400 }
    );
  }

  const updated = await prisma.photo.update({
    where: { id },
    data: {
      caption,
      isPublic,
      publishedAt: isPublic
        ? photo.isPublic && photo.publishedAt
          ? photo.publishedAt
          : new Date()
        : null,
    },
    select: {
      id: true,
      caption: true,
      isPublic: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({
    id: updated.id,
    caption: updated.caption,
    isPublic: updated.isPublic,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
  });
}
