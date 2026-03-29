import { NextRequest, NextResponse } from "next/server";
import { GUIDE_HACKS, WEEKLY_GUIDE_HACK_COUNT } from "@/lib/data/guide-hacks";

export const dynamic = "force-dynamic";

/**
 * Напоминание редакторскому процессу: раз в неделю добавлять 5–10 заметок в GUIDE_HACKS.
 * Вызов по расписанию (GitHub Actions, cron на сервере) с ?secret=CRON_SECRET.
 * Сама по себе маршрут контент не генерирует — только фиксирует, что пул актуален.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret && auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    checklist: {
      targetNewItemsPerWeek: "5–10",
      file: "lib/data/guide-hacks.ts",
      totalInPool: GUIDE_HACKS.length,
      weeklyShownCount: WEEKLY_GUIDE_HACK_COUNT,
      note:
        "Добавляйте объекты GuideHack с уникальным id, imageUrl (wikimedia) и длиной текста для читателя.",
    },
  });
}
