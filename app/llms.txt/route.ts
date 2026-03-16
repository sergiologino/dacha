import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/seo";

const content = `# Любимая Дача

> Публичный сайт и приложение для дачников России: календарь посадок, сроки посева рассады, справочник культур и анализ болезней растений по фото.

## Main pages
- ${SITE_URL}/
- ${SITE_URL}/guide
- ${SITE_URL}/kogda-sazhat-rassadu
- ${SITE_URL}/kalendar-posadok-2026
- ${SITE_URL}/facts

## High-value topical pages
- ${SITE_URL}/guide/tomat
- ${SITE_URL}/guide/perets
- ${SITE_URL}/guide/ogurets
- ${SITE_URL}/guide/baklazhan
- ${SITE_URL}/guide/luk
- ${SITE_URL}/guide/petuniya

## Scope
- Когда сажать рассаду в 2026 году
- Сроки посева по культурам и регионам России
- Когда высаживать в теплицу и открытый грунт
- Базовый уход, полив, сроки урожая
- Болезни растений и диагностика по фото
`;

export function GET() {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
