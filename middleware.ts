export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/garden/:path*",
    "/calendar/:path*",
    "/camera/:path*",
    "/subscribe/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
  ],
};
