// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isYandexCallback = url.pathname.endsWith("/callback/yandex");

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

  const response = await handlers.GET(request);

  if (isYandexCallback) {
    console.info("[auth][yandex][callback][finish]", {
      status: response.status,
      location: response.headers.get("location"),
    });
  }

  return response;
}

export async function POST(request: Request) {
  return handlers.POST(request);
}