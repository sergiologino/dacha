export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/garden/:path*",
    "/calendar/:path*",
    "/chat/:path*",
    "/camera/:path*",
    "/subscribe/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
  ],
};
