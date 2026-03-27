import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";

const OAUTH_CALLBACK_COOKIE_PREFIX = "dacha_oauth_callback_ok";
const OAUTH_CALLBACK_COOKIE_MAX_AGE_SEC = 5 * 60;
const OAUTH_CALLBACK_MEMORY_TTL_MS = 5 * 60 * 1000;

type OAuthCallbackState = {
  status: "processing" | "success";
  expiresAt: number;
};

const oauthCallbackStore = (
  globalThis as typeof globalThis & {
    __dachaOauthCallbackStore?: Map<string, OAuthCallbackState>;
  }
).__dachaOauthCallbackStore ?? new Map<string, OAuthCallbackState>();

(
  globalThis as typeof globalThis & {
    __dachaOauthCallbackStore?: Map<string, OAuthCallbackState>;
  }
).__dachaOauthCallbackStore = oauthCallbackStore;

/** Один обмен code→token на параллельные GET с тем же URL; иначе второй запрос даёт invalid_grant. */
const oauthCallbackInflight = (
  globalThis as typeof globalThis & {
    __dachaOauthCallbackInflight?: Map<string, Promise<Response>>;
  }
).__dachaOauthCallbackInflight ?? new Map<string, Promise<Response>>();

(
  globalThis as typeof globalThis & {
    __dachaOauthCallbackInflight?: Map<string, Promise<Response>>;
  }
).__dachaOauthCallbackInflight = oauthCallbackInflight;

async function hashOAuthCallbackSignature(value: string): Promise<string> {
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

function getCallbackProvider(pathname: string): string | null {
  const match = pathname.match(/\/callback\/([^/]+)$/);
  return match?.[1] ?? null;
}

function getCallbackLogPrefix(provider: string): string {
  return `[auth][${provider}][callback]`;
}

function appendDedupeCookie(
  response: Response,
  callbackCookieName: string,
  callbackSignature: string,
  secure: boolean
): void {
  const securePart = secure ? "; Secure" : "";
  response.headers.append(
    "set-cookie",
    `${callbackCookieName}=${callbackSignature}; Max-Age=${OAUTH_CALLBACK_COOKIE_MAX_AGE_SEC}; Path=/; HttpOnly; SameSite=Lax${securePart}`
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const callbackProvider = getCallbackProvider(url.pathname);
  const isOAuthCallback = !!callbackProvider;
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const cid = url.searchParams.get("cid") ?? "";
  const callbackSignature =
    isOAuthCallback && code
      ? await hashOAuthCallbackSignature(
          `${callbackProvider}:${code}:${state || cid || "no-secondary-token"}`
        )
      : null;
  const callbackCookieName = callbackProvider
    ? `${OAUTH_CALLBACK_COOKIE_PREFIX}_${callbackProvider}`
    : null;
  const cookieSecure = getPublicBaseUrl(request).toLowerCase().startsWith("https://");

  if (callbackProvider) {
    console.info(`${getCallbackLogPrefix(callbackProvider)}[start]`, {
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
  for (const [key, value] of oauthCallbackStore.entries()) {
    if (value.expiresAt <= now) {
      oauthCallbackStore.delete(key);
    }
  }

  const existingState =
    isOAuthCallback && callbackSignature
      ? oauthCallbackStore.get(callbackSignature)
      : undefined;

  if (callbackProvider && callbackSignature && existingState?.status === "success") {
    console.info(`${getCallbackLogPrefix(callbackProvider)}[duplicate-memory]`, {
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
    isOAuthCallback &&
    callbackSignature &&
    callbackCookieName &&
    request.cookies.get(callbackCookieName)?.value === callbackSignature
  ) {
    console.info(`${getCallbackLogPrefix(callbackProvider!)}[duplicate]`, {
      host: request.headers.get("host"),
      forwardedHost: request.headers.get("x-forwarded-host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
    });

    return NextResponse.redirect(buildPublicUrl("/garden", request), {
      status: 302,
    });
  }

  if (isOAuthCallback && callbackSignature && callbackCookieName) {
    const inflight = oauthCallbackInflight.get(callbackSignature);
    if (inflight) {
      console.info(`${getCallbackLogPrefix(callbackProvider!)}[inflight-join]`, {
        signaturePrefix: callbackSignature.slice(0, 8),
        host: request.headers.get("host"),
      });
      const shared = await inflight;
      return shared.clone();
    }

    const leader = (async (): Promise<Response> => {
      oauthCallbackStore.set(callbackSignature, {
        status: "processing",
        expiresAt: Date.now() + OAUTH_CALLBACK_MEMORY_TTL_MS,
      });

      try {
        const response = await handlers.GET(request);

        if (callbackProvider) {
          console.info(`${getCallbackLogPrefix(callbackProvider)}[finish]`, {
            status: response.status,
            location: response.headers.get("location"),
          });
        }

        const location = response.headers.get("location");
        if (response.status >= 300 && response.status < 400 && location) {
          try {
            const redirectUrl = new URL(location, request.url);
            if (redirectUrl.pathname === "/garden") {
              oauthCallbackStore.set(callbackSignature, {
                status: "success",
                expiresAt: Date.now() + OAUTH_CALLBACK_MEMORY_TTL_MS,
              });
              appendDedupeCookie(response, callbackCookieName, callbackSignature, cookieSecure);
            } else {
              oauthCallbackStore.delete(callbackSignature);
            }
          } catch {
            oauthCallbackStore.delete(callbackSignature);
          }
        } else {
          oauthCallbackStore.delete(callbackSignature);
        }

        return response;
      } catch (err) {
        oauthCallbackStore.delete(callbackSignature);
        throw err;
      } finally {
        oauthCallbackInflight.delete(callbackSignature);
      }
    })();

    oauthCallbackInflight.set(callbackSignature, leader);
    return leader;
  }

  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}
