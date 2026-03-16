// app/api/auth/[...nextauth]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";

const YANDEX_CALLBACK_COOKIE = "dacha_yandex_callback_ok";
const YANDEX_CALLBACK_COOKIE_MAX_AGE_SEC = 5 * 60;
const YANDEX_CALLBACK_MEMORY_TTL_MS = 5 * 60 * 1000;

type YandexCallbackState = {
  status: "processing" | "success";
  expiresAt: number;
};

const yandexCallbackStore = (
  globalThis as typeof globalThis & {
    __dachaYandexCallbackStore?: Map<string, YandexCallbackState>;
  }
).__dachaYandexCallbackStore ?? new Map<string, YandexCallbackState>();

(
  globalThis as typeof globalThis & {
    __dachaYandexCallbackStore?: Map<string, YandexCallbackState>;
  }
).__dachaYandexCallbackStore = yandexCallbackStore;

async function hashYandexCallbackSignature(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getPublicBaseUrl(request: NextRequest): string {
  const envBase =
    process.env.NEXTAUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envBase) {
    return envBase.replace(/\/+$/, "");
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (request.nextUrl.protocol ? request.nextUrl.protocol.replace(":", "") : "https");

  if (host) {
    return `${proto}://${host}`.replace(/\/+$/, "");
  }

  return request.nextUrl.origin.replace(/\/+$/, "");
}

function buildPublicUrl(path: string, request: NextRequest): URL {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${getPublicBaseUrl(request)}/`);
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

  const now = Date.now();
  for (const [key, value] of yandexCallbackStore.entries()) {
    if (value.expiresAt <= now) {
      yandexCallbackStore.delete(key);
    }
  }

  const existingState =
    isYandexCallback && callbackSignature
      ? yandexCallbackStore.get(callbackSignature)
      : undefined;

  if (isYandexCallback && callbackSignature && existingState) {
    console.info("[auth][yandex][callback][duplicate-memory]", {
      state: existingState.status,
      signaturePrefix: callbackSignature.slice(0, 8),
      host: request.headers.get("host"),
      forwardedHost: request.headers.get("x-forwarded-host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
    });

    return NextResponse.redirect(buildPublicUrl("/garden", request), {
      status: 302,
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

    return NextResponse.redirect(buildPublicUrl("/garden", request), {
      status: 302,
    });
  }

  if (isYandexCallback && callbackSignature) {
    yandexCallbackStore.set(callbackSignature, {
      status: "processing",
      expiresAt: now + YANDEX_CALLBACK_MEMORY_TTL_MS,
    });
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
          yandexCallbackStore.set(callbackSignature, {
            status: "success",
            expiresAt: Date.now() + YANDEX_CALLBACK_MEMORY_TTL_MS,
          });
          response.headers.append(
            "set-cookie",
            `${YANDEX_CALLBACK_COOKIE}=${callbackSignature}; Max-Age=${YANDEX_CALLBACK_COOKIE_MAX_AGE_SEC}; Path=/; HttpOnly; SameSite=Lax; Secure`
          );
        } else {
          yandexCallbackStore.delete(callbackSignature);
        }
      } catch {
        yandexCallbackStore.delete(callbackSignature);
      }
    } else {
      yandexCallbackStore.delete(callbackSignature);
    }
  }

  return response;
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}