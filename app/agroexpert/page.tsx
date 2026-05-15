import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Camera, Leaf, MessageCircle, ShieldCheck, Sprout } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Что такое Агроэксперт — Любимая Дача",
  description:
    "Агроэксперт в приложении Любимая Дача — специально обученная нейросеть для подсказок по выращиванию культур, болезням растений, уходу и сезонным работам.",
  alternates: {
    canonical: absoluteUrl("/agroexpert"),
  },
};

const points = [
  {
    icon: Leaf,
    title: "Знает дачные культуры",
    text: "Помогает с томатами, огурцами, ягодами, деревьями, цветами и другими растениями, которые выращивают на участке.",
  },
  {
    icon: Camera,
    title: "Разбирает фото растений",
    text: "По снимку листа или растения подсказывает, на что похоже повреждение и какие действия можно сделать дальше.",
  },
  {
    icon: MessageCircle,
    title: "Отвечает простым языком",
    text: "Объясняет без сложных терминов: когда полить, чем подкормить, что проверить и когда лучше подождать.",
  },
  {
    icon: ShieldCheck,
    title: "Не заменяет агронома на месте",
    text: "Это помощник для бытовых дачных решений. При серьёзных болезнях, химических обработках и сомнениях лучше свериться со специалистом.",
  },
];

export default function AgroExpertPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
        >
          <Sprout className="h-4 w-4" />
          Любимая Дача
        </Link>

        <section className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:items-center">
          <div>
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
              <Bot className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
              Агроэксперт — помощник по даче и огороду
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Агроэксперт — это специально обученная нейросеть для работы с выращиванием самых разных культур:
              от рассады и теплицы до сада, ягод и открытого грунта.
            </p>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Он помогает быстрее сориентироваться, но оставляет решение за вами: учитывайте погоду,
              состояние растения, инструкции к препаратам и особенности участка.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-2xl bg-emerald-600 hover:bg-emerald-700">
                <Link href="/auth/signin">Открыть приложение</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-2xl">
                <Link href="/guide">Посмотреть справочник</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden rounded-2xl border-emerald-100 bg-white/95 p-6 shadow-xl shadow-emerald-900/10 dark:border-emerald-900 dark:bg-slate-900/95">
            <div className="space-y-4">
              {points.map((point) => (
                <div key={point.title} className="flex gap-3">
                  <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <point.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                      {point.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {point.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
