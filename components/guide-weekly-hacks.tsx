import Link from "next/link";
import { GuideHackImage } from "@/components/guide-hack-image";
import { Lightbulb, Library } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWeeklyGuideHacks, GUIDE_HACKS, type GuideHack, type GuideHackCategory } from "@/lib/data/guide-hacks";

const catColors: Record<GuideHackCategory, string> = {
  "огород и теплица":
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  "участок и обустройство":
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  "обработка и уход":
    "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  "народные методы":
    "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100",
};

function HackCard({ hack }: { hack: GuideHack }) {
  return (
    <Card className="overflow-hidden flex flex-col border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800">
        <GuideHackImage
          src={hack.imageUrl}
          alt={hack.imageAlt}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <Badge className={`w-fit text-xs font-medium ${catColors[hack.category]}`}>
          {hack.category}
        </Badge>
        <h3 className="font-semibold text-base leading-snug text-slate-900 dark:text-slate-50">
          {hack.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
          {hack.text}
        </p>
      </div>
    </Card>
  );
}

export function GuideWeeklyHacksSection() {
  const weekly = getWeeklyGuideHacks();

  return (
    <section
      className="mb-10 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/70 dark:from-emerald-950/40 dark:via-slate-950 dark:to-amber-950/30 px-4 py-8 md:px-8"
      aria-labelledby="guide-hacks-heading"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-600 text-white p-3 shrink-0">
            <Lightbulb className="w-7 h-7" aria-hidden />
          </div>
          <div>
            <h2 id="guide-hacks-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Лайфхаки и народные приёмы
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Каждую календарную неделю автоматически показываем другую подборку из коллекции. Редакция
              пополняет базу лайфхаков каждую неделю — полный список с иллюстрациями открывается по ссылке ниже.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <Link
            href="/guide/lifehacks"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <Library className="w-4 h-4" aria-hidden />
            Все лайфхаки ({GUIDE_HACKS.length})
          </Link>
          <Link
            href="/facts"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:underline"
          >
            Интересные факты
          </Link>
        </div>
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-300/90 mb-3">
        Подборка этой недели
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {weekly.map((hack) => (
          <HackCard key={hack.id} hack={hack} />
        ))}
      </div>
    </section>
  );
}
