import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import {
  SEEDLING_CROP_ROWS_CLASSIC,
  SEEDLING_FAQ_CLASSIC,
} from "@/lib/data/seo-kogda-sazhat";
import { KogdaSeoBody } from "../kogda-seo-body";

export const metadata: Metadata = {
  title: "Все советы: когда сажать рассаду по месяцам (февраль–март) — 2026",
  description:
    "Полный список сроков посева рассады перца, баклажанов, томатов, огурцов, лука и петунии по классической схеме. Актуальная весенняя высадка — на основной странице «Когда сажать рассаду».",
  keywords:
    "когда сажать рассаду в 2026, когда сажать томаты на рассаду в марте, когда сажать перец на рассаду в феврале",
  alternates: {
    canonical: absoluteUrl("/kogda-sazhat-rassadu/vse-sovety"),
  },
  openGraph: {
    title: "Все советы — когда сажать рассаду",
    description: "Классические сроки посева по культурам и регионам России.",
    type: "article",
    locale: "ru_RU",
    url: absoluteUrl("/kogda-sazhat-rassadu/vse-sovety"),
  },
};

export default function SeedlingsAllTipsPage() {
  return (
    <KogdaSeoBody
      canonicalPath="/kogda-sazhat-rassadu/vse-sovety"
      jsonLdHeadline="Все советы: когда сажать рассаду по месяцам"
      jsonLdDescription="Классические сроки посева рассады по основным культурам для дачников в России."
      breadcrumbLabel="Когда сажать рассаду — все советы"
      h1="Когда сажать рассаду — все советы (февраль–март)"
      intro="Это сохранённый полный текст с ориентирами по посеву семян на рассаду: перец, баклажаны, томаты, огурцы, лук и петуния. Если вам нужна высадка и уход во второй половине апреля — мая — июня, откройте актуальную версию страницы по ссылке ниже."
      cropRows={SEEDLING_CROP_ROWS_CLASSIC}
      faq={SEEDLING_FAQ_CLASSIC}
      siblingSeasonLink={{
        href: "/kogda-sazhat-rassadu",
        label: "Актуально весной 2026: апрель, май, июнь (закалка и высадка)",
      }}
    />
  );
}
