import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { GuideHackImage } from "@/components/guide-hack-image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GUIDE_HACKS,
  type GuideHack,
  type GuideHackCategory,
} from "@/lib/data/guide-hacks";
import { absoluteUrl } from "@/lib/seo";

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

export const metadata: Metadata = {
  title: "Лайфхаки для дачи и огорода — полный список",
  description:
    "Народные приёмы, идеи для участка, обработка растений и необычные методы с иллюстрациями. Коллекция справочника «Любимая Дача».",
  alternates: { canonical: absoluteUrl("/guide/lifehacks") },
};

function HackCard({ hack }: { hack: GuideHack }) {
  return (
    <Card className="overflow-hidden flex flex-col border-slate-200 dark:border-slate-700">
      <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800">
        <GuideHackImage
          src={hack.imageUrl}
          alt={hack.imageAlt}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <Badge className={`w-fit text-xs ${catColors[hack.category]}`}>{hack.category}</Badge>
        <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-50">{hack.title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{hack.text}</p>
      </div>
    </Card>
  );
}

export default function GuideLifehacksPage() {
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
        Полный архив: выращивание, благоустройство, обработка культур и народные методы. На главной
        справочника каждую неделю показывается новая подборка из этой коллекции.
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDE_HACKS.map((hack) => (
          <HackCard key={hack.id} hack={hack} />
        ))}
      </div>
    </div>
  );
}
