import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import {
  CALENDAR_FEATURED_MONTHS_CLASSIC,
  CALENDAR_FAQ_CLASSIC,
} from "@/lib/data/seo-kalendar-posadok";
import { KalendarSeoBody } from "../kalendar-seo-body";

export const metadata: Metadata = {
  title: "Календарь посадок 2026 — все советы (февраль–май и осень)",
  description:
    "Полный помесячный календарь посадок 2026: февраль, март, апрель, май и осенние работы. Актуальный весенне-летний блок (апрель–июнь) — на основной странице календаря.",
  keywords:
    "календарь посадок 2026 полный, что сажать в феврале 2026, что сажать в марте на рассаду, лунный календарь посадок",
  alternates: {
    canonical: absoluteUrl("/kalendar-posadok-2026/vse-sovety"),
  },
  openGraph: {
    title: "Календарь посадок 2026 — все советы",
    description: "Февраль, март, апрель, май и осень: задачи на даче.",
    type: "article",
    locale: "ru_RU",
    url: absoluteUrl("/kalendar-posadok-2026/vse-sovety"),
  },
};

export default function PlantingCalendarAllTipsPage() {
  return (
    <KalendarSeoBody
      canonicalPath="/kalendar-posadok-2026/vse-sovety"
      jsonLdHeadline="Календарь посадок 2026 — полный обзор по месяцам"
      jsonLdDescription="Помесячный календарь для дачника: ранняя весна, поздняя весна и осень."
      breadcrumbLabel="Календарь посадок — все советы"
      h1="Календарь посадок 2026 — все советы"
      intro="Это сохранённый расширенный вариант страницы: февраль, март, апрель, май и отдельные осенние задачи. Если вам сейчас актуальны апрель, май и июнь в одном фокусе, перейдите на основную версию календаря."
      featuredMonths={CALENDAR_FEATURED_MONTHS_CLASSIC}
      tasksPerMonth={4}
      faq={CALENDAR_FAQ_CLASSIC}
      siblingSeasonLink={{
        href: "/kalendar-posadok-2026",
        label: "Актуально весной и летом 2026: апрель, май, июнь",
      }}
    />
  );
}
