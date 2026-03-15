// app/api/auth/[...nextauth]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";

const YANDEX_CALLBACK_COOKIE = "dacha_yandex_callback_ok";
const YANDEX_CALLBACK_COOKIE_MAX_AGE_SEC = 5 * 60;

async function hashYandexCallbackSignature(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const isYandexCallback = url.pathname.endsWith("/callback/yandex");
  const code = url.searchParams.get("code") ?? "";
  const cid = url.searchParams.get("cid") ?? "";
  const callbackSignature =
    isYandexCallback && code
      ? await hashYandexCallbackSignature(`${code}:${cid}`)
      : null;

  if (isYandexCallback) {
    console.info("[auth][yandex][callback][start]", {
      host: request.headers.get("host"),
      forwardedHost: request.headers.get("x-forwarded-host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
      referer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      hasCode: url.searchParams.has("code"),
      hasState: url.searchParams.has("state"),
      searchKeys: Array.from(url.searchParams.keys()),
    });
  }

  if (
    isYandexCallback &&
    callbackSignature &&
    request.cookies.get(YANDEX_CALLBACK_COOKIE)?.value === callbackSignature
  ) {
    console.info("[auth][yandex][callback][duplicate]", {
      host: request.headers.get("host"),
      forwardedHost: request.headers.get("x-forwarded-host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
    });

    return NextResponse.redirect(new URL("/garden", request.url), { status: 302 });
  }

  const response = await handlers.GET(request);

  if (isYandexCallback) {
    console.info("[auth][yandex][callback][finish]", {
      status: response.status,
      location: response.headers.get("location"),
    });
  }

  if (isYandexCallback && callbackSignature) {
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      try {
        const redirectUrl = new URL(location, request.url);
        if (redirectUrl.pathname === "/garden") {
          response.headers.append(
            "set-cookie",
            `${YANDEX_CALLBACK_COOKIE}=${callbackSignature}; Max-Age=${YANDEX_CALLBACK_COOKIE_MAX_AGE_SEC}; Path=/; HttpOnly; SameSite=Lax; Secure`
          );
        }
      } catch {
        // ignore malformed redirect target
      }
    }
  }

  return response;
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}