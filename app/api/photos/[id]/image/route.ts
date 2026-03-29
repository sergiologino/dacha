import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export const dynamic = "force-dynamic";

/**
 * Отдаёт байты фото владельцу по id (сессия в cookie).
 * Нужен, потому что <img src="/uploads/..."> в проде часто ломается: standalone, прокси, кэш, не тот cwd.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return new NextResponse(null, { status: 401 });
  }

  const { id } = await context.params;
  const photo = await prisma.photo.findFirst({
    where: {
      id,
      OR: [
        { userId: user.id },
        { plant: { userId: user.id } },
        { bed: { userId: user.id } },
      ],
    },
    select: { url: true },
  });

  if (!photo?.url) {
    return new NextResponse(null, { status: 404 });
  }

  let { url } = photo;
  if (!url.startsWith("data:") && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = url.replace(/^\/+/, "");
    if (url.startsWith("uploads/")) url = `/${url}`;
  }

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
    const baseDir = path.resolve(path.join(process.cwd(), "public", "uploads"));
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
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return NextResponse.redirect(url);
  }

  return new NextResponse(null, { status: 422 });
}
