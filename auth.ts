import NextAuth from "next-auth";
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

// Сессия: не требовать авторизацию при каждом входе. Истекает через 7 дней без активности или при выходе.
const SESSION_MAX_AGE_DAYS = 7;
const SESSION_MAX_AGE_SEC = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
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
      // При первом входе сохраняем пользователя в токен (как по умолчанию в NextAuth).
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      // Продлеваем срок действия при каждом обращении (сессия истекает через 7 дней без активности).
      if (token) {
        token.exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string;
        session.user.name = token.name ?? "";
        session.user.email = token.email ?? "";
        session.user.image = token.picture ?? "";
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