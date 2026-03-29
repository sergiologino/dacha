import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { userOwnsPhotoRow } from "@/lib/photo-access";

export const dynamic = "force-dynamic";

/** Каталог файлов на диске: по умолчанию `public/uploads`, или абсолютный путь (том в Docker). */
function uploadsBaseDir(): string {
  const fromEnv = process.env.PHOTOS_UPLOAD_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(path.join(process.cwd(), "public", "uploads"));
}

function normalizeStoredUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith("data:") && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = url.replace(/^\/+/, "");
    if (url.startsWith("uploads/")) url = `/${url}`;
  }
  return url;
}

/**
 * Отдаёт байты фото владельцу по id (сессия в cookie).
 * Нужен, потому что <img src="/uploads/..."> в проде часто ломается: standalone, прокси, кэш, не тот cwd.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) {
    return new NextResponse(null, { status: 401 });
  }

  const { id } = await context.params;
  const row = await prisma.photo.findUnique({
    where: { id },
    select: { url: true, userId: true, plantId: true, bedId: true },
  });

  if (!row?.url?.trim()) {
    return new NextResponse(null, { status: 404 });
  }

  if (!(await userOwnsPhotoRow(user.id, row))) {
    return new NextResponse(null, { status: 404 });
  }

  const url = normalizeStoredUrl(row.url);

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
          "Cache-Control": "private, max-age=3600",
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
    const baseDir = uploadsBaseDir();
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
          "Cache-Control": "private, max-age=240",
        },
      });
    } catch (err) {
      console.warn("[photos/image] readFile failed, try static redirect", {
        id,
        filepath,
        cwd: process.cwd(),
        uploadDir: baseDir,
        message: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.redirect(new URL(url, request.nextUrl.origin), 307);
    }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return NextResponse.redirect(url);
  }

  return new NextResponse(null, { status: 422 });
}
