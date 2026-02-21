import { Metadata } from "next";
import { LandingContent } from "./landing-content";

export const metadata: Metadata = {
  title: "ДачаAI — умный AI-помощник для дачников и садоводов",
  description:
    "Персональный AI-помощник для садоводов: календарь посадок по региону, анализ болезней растений по фото, справочник 100+ культур. Работает без интернета.",
  keywords:
    "дача, огород, сад, AI помощник, календарь посадок, болезни растений, справочник растений, садоводство",
  openGraph: {
    title: "ДачаAI — умный AI-помощник для дачников",
    description: "Календарь, фото-анализ, справочник. Работает без интернета.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function LandingPage() {
  return <LandingContent />;
}
