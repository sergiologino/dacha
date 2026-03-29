import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set(["upload.wikimedia.org"]);

/**
 * Прокси иллюстраций лайфхаков: с сервера РФ/CDN Wikimedia часто не открывается в браузере;
 * запрос с VPS обычно проходит. query: ?url=https%3A%2F%2Fupload.wikimedia.org%2F...
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw?.trim()) {
    return new NextResponse(null, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw.trim());
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new NextResponse(null, { status: 403 });
  }

  const upstream = await fetch(target.toString(), {
    headers: {
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      "User-Agent":
        "DachaAI-GuideImage/1.0 (https://dacha-ai.ru/guide/lifehacks; image proxy for readers)",
    },
    next: { revalidate: 86_400 },
  });

  if (!upstream.ok) {
    return new NextResponse(null, { status: 502 });
  }

  const ct = upstream.headers.get("content-type") || "image/jpeg";
  if (!ct.startsWith("image/")) {
    return new NextResponse(null, { status: 502 });
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  if (!buf.length) {
    return new NextResponse(null, { status: 502 });
  }

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": ct.split(";")[0]!.trim(),
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
