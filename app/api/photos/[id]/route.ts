import { unlink } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { userOwnsPhotoRow } from "@/lib/photo-access";

export const dynamic = "force-dynamic";

function uploadsDirOnDisk(): string {
  const fromEnv = process.env.PHOTOS_UPLOAD_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(path.join(process.cwd(), "public", "uploads"));
}

async function tryRemoveStoredFile(dbUrl: string): Promise<void> {
  if (!dbUrl.startsWith("/uploads/")) return;
  const base = path.basename(dbUrl);
  if (!base || base.includes("..")) return;
  const resolvedDir = uploadsDirOnDisk();
  const full = path.resolve(resolvedDir, base);
  if (!full.startsWith(resolvedDir + path.sep)) return;
  try {
    await unlink(full);
  } catch {
    /* файл уже убран или только data-url в БД */
  }
}

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
