import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import {
  CALENDAR_FEATURED_MONTHS_LATE_SPRING,
  CALENDAR_FAQ_LATE_SPRING,
} from "@/lib/data/seo-kalendar-posadok";
import { KalendarSeoBody } from "./kalendar-seo-body";

export const metadata: Metadata = {
  title: "Календарь посадок апрель–июнь 2026 — дача и огород",
  description:
    "Что делать на даче в апреле, мае и июне 2026: посев, высадка рассады, уход и сбор. Полный помесячный обзор с февраля и осенью — в разделе «Все советы».",
  keywords:
    "календарь посадок май 2026, что сажать в апреле на огороде, работы на даче в июне 2026, календарь дачника весна",
  alternates: {
    canonical: absoluteUrl("/kalendar-posadok-2026"),
  },
  openGraph: {
    title: "Календарь посадок — апрель, май, июнь 2026",
    description: "Весенне-летние работы на огороде: посев, высадка, уход.",
    type: "article",
    locale: "ru_RU",
    url: absoluteUrl("/kalendar-posadok-2026"),
  },
};

export default function PlantingCalendarSeoPage() {
  return (
    <KalendarSeoBody
      canonicalPath="/kalendar-posadok-2026"
      jsonLdHeadline="Календарь посадок апрель–июнь 2026"
      jsonLdDescription="Помесячные задачи для дачи и огорода весной и начале лета: апрель, май, июнь."
      breadcrumbLabel="Календарь посадок 2026"
      h1="Календарь посадок 2026 — апрель, май, июнь"
      intro="Ниже собраны типичные работы для тёплой весны и начала лета: что сеять и высаживать, как ухаживать за грядками и теплицей. Это удобно, если вы открываете календарь во второй половине апреля или в мае. Расширенный вариант с февралём, мартом и осенними месяцами доступен по ссылке «Все советы»."
      featuredMonths={CALENDAR_FEATURED_MONTHS_LATE_SPRING}
      tasksPerMonth={6}
      faq={CALENDAR_FAQ_LATE_SPRING}
      allTipsBlock={{
        href: "/kalendar-posadok-2026/vse-sovety",
        title: "Все советы: календарь посадок 2026 (февраль, март, апрель, май, осень)",
        lines: [
          "Зимние и ранние весенние задачи для рассады",
          "Сочетание весенних и осенних работ в одном обзоре",
          "Ответы про лунный календарь и высадку в теплицу",
        ],
      }}
    />
  );
}
