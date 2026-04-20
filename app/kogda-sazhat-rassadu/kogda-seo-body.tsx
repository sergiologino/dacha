import Link from "next/link";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/seo";
import type { SeedlingSeoRow } from "@/lib/data/seo-kogda-sazhat";

type FaqItem = { question: string; answer: string };

type Props = {
  canonicalPath: string;
  jsonLdHeadline: string;
  jsonLdDescription: string;
  breadcrumbLabel: string;
  h1: string;
  intro: string;
  cropRows: SeedlingSeoRow[];
  faq: FaqItem[];
  allTipsBlock?: { href: string; title: string; lines: string[] };
  siblingSeasonLink?: { href: string; label: string };
};

export function KogdaSeoBody({
  canonicalPath,
  jsonLdHeadline,
  jsonLdDescription,
  breadcrumbLabel,
  h1,
  intro,
  cropRows,
  faq,
  allTipsBlock,
  siblingSeasonLink,
}: Props) {
  const url = absoluteUrl(canonicalPath);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: jsonLdHeadline,
            description: jsonLdDescription,
            url,
            inLanguage: "ru-RU",
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Главная
          </Link>
          {" / "}
          <span>{breadcrumbLabel}</span>
        </nav>

        {siblingSeasonLink ? (
          <p className="mb-6 text-sm">
            <Link
              href={siblingSeasonLink.href}
              className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              ← {siblingSeasonLink.label}
            </Link>
          </p>
        ) : null}

        {allTipsBlock ? (
          <p className="mb-6 text-sm">
            <Link
              href={allTipsBlock.href}
              className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              {allTipsBlock.title}
            </Link>
          </p>
        ) : null}

        <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">{h1}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{intro}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {cropRows.map((item) => (
            <Card key={item.name} className="p-5">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{item.name}</h2>
              <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Когда сажать: {item.timing}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.details}</p>
              <Link
                href={item.href}
                className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
              >
                Открыть справочник по культуре →
              </Link>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold">По регионам</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Один и тот же срок не подходит для всех регионов. В Подмосковье и средней полосе сезон
              обычно идёт по привычному графику, а на Урале, в Сибири и в более прохладных районах
              высадку смещают на более поздние даты, чтобы не потерять рассаду от холода.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Если планируете теплицу, часть работ можно сделать раньше. Если только открытый грунт,
              ориентируйтесь на последние заморозки и прогревание почвы весной.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold">Как выбрать точный срок</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Удобнее всего идти от даты будущей высадки: сначала понять, когда в вашем регионе
              обычно заканчиваются заморозки, а затем отсчитать назад нужное число дней для каждой
              культуры или наоборот — от текущей даты на окне понять, успеет ли растение к нужной
              высадке без перерастания.
            </p>
          </Card>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="text-2xl font-semibold">Частые вопросы</h2>
          <div className="mt-6 space-y-5">
            {faq.map((item) => (
              <div key={item.question}>
                <h3 className="text-lg font-medium text-slate-950 dark:text-white">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {allTipsBlock ? (
          <Card className="mt-10 border-dashed border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{allTipsBlock.title}</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {allTipsBlock.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <Link
              href={allTipsBlock.href}
              className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Открыть полный текст раздела →
            </Link>
          </Card>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/kalendar-posadok-2026"
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Смотреть календарь посадок 2026
          </Link>
          <Link
            href="/guide"
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200"
          >
            Открыть справочник культур
          </Link>
        </div>
      </div>
    </div>
  );
}
