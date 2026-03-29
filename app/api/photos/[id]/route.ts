import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { userOwnsPhotoRow } from "@/lib/photo-access";
import { tryRemoveStoredFile } from "@/lib/photo-storage";

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
  const row = await prisma.photo.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      plantId: true,
      bedId: true,
      isPublic: true,
      publishedAt: true,
    },
  });
  const photo =
    row && (await userOwnsPhotoRow(user.id, row))
      ? { id: row.id, isPublic: row.isPublic, publishedAt: row.publishedAt }
      : null;

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  const data: {
    caption?: string | null;
    isPublic?: boolean;
    publishedAt?: Date | null;
  } = {};

  if ("caption" in body) {
    const raw = body.caption;
    const caption =
      raw === null || raw === undefined
        ? null
        : typeof raw === "string"
          ? raw.trim()
          : null;
    if (caption && caption.length > 280) {
      return NextResponse.json(
        { error: "Подпись слишком длинная" },
        { status: 400 }
      );
    }
    data.caption = caption;
  }

  if (typeof body.isPublic === "boolean") {
    data.isPublic = body.isPublic;
    data.publishedAt = body.isPublic
      ? photo.isPublic && photo.publishedAt
        ? photo.publishedAt
        : new Date()
      : null;
  }

  if (Object.keys(data).length === 0) {
    const unchanged = await prisma.photo.findUnique({
      where: { id },
      select: {
        id: true,
        caption: true,
        isPublic: true,
        publishedAt: true,
      },
    });
    if (!unchanged) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: unchanged.id,
      caption: unchanged.caption,
      isPublic: unchanged.isPublic,
      publishedAt: unchanged.publishedAt?.toISOString() ?? null,
    });
  }

  const updated = await prisma.photo.update({
    where: { id },
    data,
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const row = await prisma.photo.findUnique({
    where: { id },
    select: {
      id: true,
      url: true,
      userId: true,
      plantId: true,
      bedId: true,
    },
  });
  const ok = row && (await userOwnsPhotoRow(user.id, row));
  if (!ok || !row) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  await prisma.photo.delete({ where: { id: row.id } });
  await tryRemoveStoredFile(row.url);

  return NextResponse.json({ ok: true });
}
