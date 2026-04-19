import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import {
  SEEDLING_CROP_ROWS_LATE_SPRING,
  SEEDLING_FAQ_LATE_SPRING,
} from "@/lib/data/seo-kogda-sazhat";
import { KogdaSeoBody } from "./kogda-seo-body";

export const metadata: Metadata = {
  title: "Когда сажать рассаду весной 2026 — апрель, май, июнь",
  description:
    "Актуально на вторую половину апреля 2026: закалка и высадка рассады томатов, перца, огурцов и капусты по регионам России. Полный текст сроков посева — в разделе «Все советы».",
  keywords:
    "когда высаживать рассаду в мае 2026, когда сажать огурцы в апреле, высадка рассады в теплицу, когда сажать рассаду весной",
  alternates: {
    canonical: absoluteUrl("/kogda-sazhat-rassadu"),
  },
  openGraph: {
    title: "Когда сажать рассаду — апрель–июнь 2026",
    description:
      "Высадка и закалка рассады: томаты, перец, огурцы, капуста, кабачки и цветы весной 2026.",
    type: "article",
    locale: "ru_RU",
    url: absoluteUrl("/kogda-sazhat-rassadu"),
  },
};

export default function SeedlingsSeoPage() {
  return (
    <KogdaSeoBody
      canonicalPath="/kogda-sazhat-rassadu"
      jsonLdHeadline="Когда сажать и высаживать рассаду весной 2026"
      jsonLdDescription="Советы по закалке и высадке рассады во второй половине апреля, в мае и июне по регионам России."
      breadcrumbLabel="Когда сажать рассаду"
      h1="Когда сажать и высаживать рассаду — апрель–июнь 2026"
      intro="Сейчас у многих дачников на окне или в теплице уже есть рассада: важно вовремя закалить растения и перенести их в грунт без стресса. Ниже — ориентиры на вторую половину апреля, май и июнь: что делать с томатами, перцем, огурцами, капустой, кабачками и цветами. Классические сроки посева (февраль–март) и общие ответы на запросы «когда сажать рассаду в 2026» сохранены в разделе «Все советы»."
      cropRows={SEEDLING_CROP_ROWS_LATE_SPRING}
      faq={SEEDLING_FAQ_LATE_SPRING}
      allTipsBlock={{
        href: "/kogda-sazhat-rassadu/vse-sovety",
        title: "Все советы: сроки посева рассады (февраль–март и общий календарь 2026)",
        lines: [
          "Перец, баклажаны, томаты на подоконнике — по месяцам посева",
          "Огурцы и лук-порей — когда обычно сеют семена",
          "Ответы на запросы «когда сажать рассаду в Подмосковье / Сибири»",
        ],
      }}
    />
  );
}
