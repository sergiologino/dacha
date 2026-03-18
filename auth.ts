import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Yandex from "next-auth/providers/yandex";

const providers = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      profile(profile) {
        return {
          id: String(profile.sub ?? profile.id ?? ""),
          name: typeof profile.name === "string" ? profile.name : null,
          email: typeof profile.email === "string" ? profile.email : null,
          image: typeof profile.picture === "string" ? profile.picture : null,
        };
      },
    })
  );
}

if (process.env.AUTH_YANDEX_ID && process.env.AUTH_YANDEX_SECRET) {
  providers.push(
    Yandex({
      clientId: process.env.AUTH_YANDEX_ID,
      clientSecret: process.env.AUTH_YANDEX_SECRET,
      profile(profile) {
        const yandexProfile = profile as {
          id?: string | number;
          client_id?: string;
          default_email?: string;
          emails?: string[];
          real_name?: string;
          display_name?: string;
          login?: string;
          default_avatar_id?: string;
          avatar_url?: string;
        };
        const candidateEmail =
          typeof yandexProfile.default_email === "string"
            ? yandexProfile.default_email
            : Array.isArray(yandexProfile.emails) && typeof yandexProfile.emails[0] === "string"
              ? yandexProfile.emails[0]
              : null;

        const candidateName =
          typeof yandexProfile.real_name === "string"
            ? yandexProfile.real_name
            : typeof yandexProfile.display_name === "string"
              ? yandexProfile.display_name
              : typeof yandexProfile.login === "string"
                ? yandexProfile.login
                : null;

        const candidateImage =
          typeof yandexProfile.default_avatar_id === "string" && yandexProfile.default_avatar_id
            ? `https://avatars.yandex.net/get-yapic/${yandexProfile.default_avatar_id}/islands-200`
            : typeof yandexProfile.avatar_url === "string"
              ? yandexProfile.avatar_url
              : null;

        return {
          id: String(yandexProfile.id ?? yandexProfile.client_id ?? ""),
          name: candidateName,
          email: candidateEmail,
          image: candidateImage,
        };
      },
    })
  );
}

providers.push(
  Credentials({
    id: "phone-otp",
    name: "Телефон",
    credentials: {
      phone: { label: "Телефон", type: "text" },
      code: { label: "Код", type: "text" },
    },
    async authorize(credentials) {
      const phone = typeof credentials?.phone === "string" ? credentials.phone : "";
      const code = typeof credentials?.code === "string" ? credentials.code : "";
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://127.0.0.1:3000";

      const response = await fetch(`${baseUrl}/api/auth/phone/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code }),
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        user?: {
          id: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          phone?: string | null;
        };
      };

      return data.user ?? null;
    },
  }),
);

// Сессия: не требовать авторизацию при каждом входе. Истекает через 7 дней без активности или при выходе.
const SESSION_MAX_AGE_DAYS = 7;
const SESSION_MAX_AGE_SEC = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  logger: {
    error(error) {
      console.error("[auth][logger][error]", error);
    },
    warn(code) {
      console.warn("[auth][logger][warn]", code);
    },
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SEC,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.phone = user.phone ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.name = token.name ?? "";
        session.user.email = typeof token.email === "string" ? token.email : "";
        session.user.image = typeof token.picture === "string" ? token.picture : "";
        session.user.phone = typeof token.phone === "string" ? token.phone : null;
      }
      return session;
    },
    // Не используем Prisma здесь: middleware работает в Edge Runtime, где Prisma (node:*) недоступен.
    async signIn() {
      return true;
    },
    authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isProtected = request.nextUrl.pathname.startsWith("/garden") ||
        request.nextUrl.pathname.startsWith("/calendar") ||
        request.nextUrl.pathname.startsWith("/camera") ||
        request.nextUrl.pathname.startsWith("/subscribe") ||
        request.nextUrl.pathname.startsWith("/onboarding") ||
        request.nextUrl.pathname.startsWith("/settings");

      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
});