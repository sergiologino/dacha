import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WEEKLY_GUIDE_HACK_COUNT } from "@/lib/data/guide-hacks";

export const dynamic = "force-dynamic";

/**
 * Напоминание редакторскому процессу: раз в неделю добавлять 5–10 заметок в пул лайфхаков (сид + БД).
 * Вызов по расписанию с ?secret=CRON_SECRET. Контент не генерирует — только сводка по пулу.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret && auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const totalInPool = await prisma.guideHack.count({ where: { published: true } });

  return NextResponse.json({
    ok: true,
    checklist: {
      targetNewItemsPerWeek: "5–10",
      seedFiles: "prisma/seed-data/hacks-legacy.ts, prisma/seed-data/hacks-extra.ts",
      applySeedCommand: "npx tsx prisma/seed-guide-content.ts",
      totalInPool,
      weeklyShownCount: WEEKLY_GUIDE_HACK_COUNT,
      note:
        "Добавляйте записи с уникальным slug, imageUrl (wikimedia или локальный путь) и текстом для читателя; затем прогоните сид.",
    },
  });
}
