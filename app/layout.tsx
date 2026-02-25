import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { YandexMetrika, GoogleAnalytics } from "@/components/analytics";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Любимая Дача — помощник для дачников",
    template: "%s | Любимая Дача",
  },
  description:
    "Помощник для садоводов: календарь посадок, анализ болезней по фото, справочник 100+ культур, лунный календарь.",
  metadataBase: new URL("https://dacha-ai.ru"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Любимая Дача — помощник для дачников",
    description:
      "Календарь посадок, анализ болезней по фото, справочник 100+ культур, лунный календарь. Работает без интернета.",
    siteName: "Любимая Дача",
    type: "website",
    locale: "ru_RU",
    url: "https://dacha-ai.ru",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Любимая Дача — помощник для дачников",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Любимая Дача — помощник для дачников",
    description:
      "Календарь посадок, анализ болезней по фото, справочник культур, лунный календарь.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Любимая Дача",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
        <YandexMetrika />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
