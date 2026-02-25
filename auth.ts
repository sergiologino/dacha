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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    // Не используем Prisma здесь: middleware работает в Edge Runtime, где Prisma (node:*) недоступен.
    // Пользователь создаётся/обновляется при первом вызове getAuthUser() в API/Server Components.
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