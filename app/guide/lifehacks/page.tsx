import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { absoluteUrl } from "@/lib/seo";
import { getPublishedGuideHacks } from "@/lib/queries/guide-content";
import { LifehacksGrid } from "./lifehacks-grid";

export const metadata: Metadata = {
  title: "Лайфхаки для дачи и огорода — полный список",
  description:
    "Народные приёмы, идеи для участка, обработка культур и необычные методы с иллюстрациями. Коллекция справочника «Любимая Дача».",
  alternates: { canonical: absoluteUrl("/guide/lifehacks") },
};

export default async function GuideLifehacksPage() {
  let hacks = await getPublishedGuideHacks().catch(() => []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/guide"
        className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        К справочнику культур
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Lightbulb className="w-9 h-9 text-emerald-600" aria-hidden />
        <h1 className="text-3xl font-bold">Лайфхаки для дачи и огорода</h1>
      </div>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-3xl">
        Полный архив по категориям: выращивание, благоустройство, почва, полив, защита растений и
        простые приёмы. На главной справочника каждую неделю показывается новая подборка из этой
        коллекции.
      </p>

      {hacks.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">
          Коллекция пока пуста. Контент подставляется при старте приложения после миграций; обновите
          страницу через минуту.
        </p>
      ) : (
        <LifehacksGrid hacks={hacks} />
      )}
    </div>
  );
}
