import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { userOwnsPhotoRow } from "@/lib/photo-access";
import { normalizeStoredPhotoUrl } from "@/lib/photo-image-utils";
import { uploadsDirOnDisk } from "@/lib/photo-storage";

export const dynamic = "force-dynamic";

/**
 * Отдаёт байты фото по id: владелец (сессия) или любой посетитель для опубликованного в галерее
 * (isPublic + publishedAt). Так гостевая /gallery и превью в соцсетях не зависят от статики /uploads.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();

  const { id } = await context.params;
  const row = await prisma.photo.findUnique({
    where: { id },
    select: {
      url: true,
      userId: true,
      plantId: true,
      bedId: true,
      isPublic: true,
      publishedAt: true,
    },
  });

  if (!row?.url?.trim()) {
    return new NextResponse(null, { status: 404 });
  }

  const publishedInGallery = row.isPublic && row.publishedAt != null;
  const ownerOk = user ? await userOwnsPhotoRow(user.id, row) : false;
  if (!ownerOk && !publishedInGallery) {
    return new NextResponse(null, { status: 404 });
  }

  const url = normalizeStoredPhotoUrl(row.url);

  if (url.startsWith("data:")) {
    const marker = ";base64,";
    const i = url.indexOf(marker);
    if (i === -1) return new NextResponse(null, { status: 422 });
    const mimePart = url.slice(5, i);
    const b64 = url.slice(i + marker.length).replace(/\s/g, "");
    try {
      const buf = Buffer.from(b64, "base64");
      if (!buf.length) return new NextResponse(null, { status: 422 });
      const contentType = (mimePart || "image/jpeg").split(";")[0]!.trim();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": publishedInGallery ? "public, max-age=600" : "private, max-age=3600",
        },
      });
    } catch {
      return new NextResponse(null, { status: 422 });
    }
  }

  if (url.startsWith("/uploads/")) {
    const clean = url.replace(/^\/+/, "");
    const parts = clean.split("/");
    if (parts[0] !== "uploads" || parts.length !== 2 || !parts[1] || parts.some((p) => p === "..")) {
      return new NextResponse(null, { status: 403 });
    }
    const filename = parts[1]!;
    const baseDir = uploadsDirOnDisk();
    const filepath = path.resolve(path.join(baseDir, filename));
    const rel = path.relative(baseDir, filepath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      return new NextResponse(null, { status: 403 });
    }
    try {
      const buf = await readFile(filepath);
      if (!buf.length) return new NextResponse(null, { status: 404 });
      const ext = path.extname(filename).toLowerCase();
      const mime =
        ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": publishedInGallery ? "public, max-age=600" : "private, max-age=240",
        },
      });
    } catch (err) {
      console.warn("[photos/image] readFile failed (файл не на диске — задайте том или PLANT_PHOTOS_INLINE=1)", {
        id,
        filepath,
        cwd: process.cwd(),
        uploadDir: baseDir,
        message: err instanceof Error ? err.message : String(err),
      });
      return new NextResponse(null, { status: 404 });
    }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return NextResponse.redirect(url);
  }

  return new NextResponse(null, { status: 422 });
}
