import { Metadata } from "next";
import { LandingContent } from "./landing-content";

export const metadata: Metadata = {
  title: "Любимая Дача — умный AI-помощник для дачников и садоводов",
  description:
    "Персональный AI-помощник для садоводов: календарь посадок по региону, анализ болезней растений по фото, справочник 100+ культур. Работает без интернета.",
  keywords:
    "дача, огород, сад, AI помощник, календарь посадок, болезни растений, справочник растений, садоводство",
  openGraph: {
    title: "Любимая Дача — умный AI-помощник для дачников",
    description: "Календарь посадок, анализ болезней по фото, справочник 100+ культур, лунный календарь.",
    type: "website",
    locale: "ru_RU",
    url: "https://dacha-ai.ru",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Любимая Дача" }],
  },
  twitter: {
    card: "summary",
    title: "Любимая Дача — умный AI-помощник для дачников",
    description: "Календарь посадок, анализ болезней по фото, справочник культур.",
  },
};

export default function LandingPage() {
  return <LandingContent />;
}
