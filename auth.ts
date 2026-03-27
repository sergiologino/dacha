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
    })
  );
}

if (process.env.AUTH_YANDEX_ID && process.env.AUTH_YANDEX_SECRET) {
  providers.push(
    Yandex({
      clientId: process.env.AUTH_YANDEX_ID,
      clientSecret: process.env.AUTH_YANDEX_SECRET,
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

// Сессия JWT: до 30 дней с последнего продления; при заходах в приложение срок сдвигается (updateAge),
// пока пользователь не пропадёт на месяц или не нажмёт «Выход».
const SESSION_MAX_AGE_DAYS = 30;
const SESSION_MAX_AGE_SEC = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
/** Минимум секунд между продлениями cookie при обращении к сессии (скользящее окно). */
const SESSION_UPDATE_AGE_SEC = 24 * 60 * 60;

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
    updateAge: SESSION_UPDATE_AGE_SEC,
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
    // Не используем Prisma здесь: proxy (бывш. middleware) в Edge Runtime, где Prisma (node:*) недоступен.
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