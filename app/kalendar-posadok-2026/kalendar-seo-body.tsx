import Link from "next/link";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { calendarTasks, monthNames } from "@/lib/data/calendar-tasks";
import { absoluteUrl } from "@/lib/seo";

type FaqItem = { question: string; answer: string };

type Props = {
  canonicalPath: string;
  jsonLdHeadline: string;
  jsonLdDescription: string;
  breadcrumbLabel: string;
  h1: string;
  intro: string;
  featuredMonths: readonly number[];
  tasksPerMonth: number;
  faq: FaqItem[];
  allTipsBlock?: { href: string; title: string; lines: string[] };
  siblingSeasonLink?: { href: string; label: string };
};

export function KalendarSeoBody({
  canonicalPath,
  jsonLdHeadline,
  jsonLdDescription,
  breadcrumbLabel,
  h1,
  intro,
  featuredMonths,
  tasksPerMonth,
  faq,
  allTipsBlock,
  siblingSeasonLink,
}: Props) {
  const url = absoluteUrl(canonicalPath);
  const monthBlocks = featuredMonths.map((month) => ({
    month,
    title: monthNames[month - 1],
    tasks: calendarTasks.filter((task) => task.month === month).slice(0, tasksPerMonth),
  }));

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

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {monthBlocks.map((block) => (
            <Card key={block.month} className="p-6">
              <h2 className="text-2xl font-semibold">{block.title}</h2>
              <div className="mt-4 space-y-4">
                {block.tasks.map((task) => (
                  <div key={task.title}>
                    <h3 className="font-medium text-slate-950 dark:text-white">{task.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {task.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold">Лунный календарь и реальные сроки</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Лунный календарь можно использовать как дополнительный ориентир, если вам так удобнее.
              Но на практике важнее учитывать температуру воздуха и почвы, ваш регион, теплицу или
              открытый грунт и риск возвратных заморозков.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold">Как пользоваться календарём</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Сначала посмотрите свой месяц и список актуальных работ, а затем уточните сроки для
              конкретной культуры в справочнике. Так проще понять, когда именно сеять, высаживать
              и как ухаживать за томатами, перцем, огурцами, баклажанами, луком и цветами.
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
          <Card className="mt-10 border-dashed border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{allTipsBlock.title}</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {allTipsBlock.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <Link
              href={allTipsBlock.href}
              className="mt-4 inline-block text-sm font-medium text-amber-800 hover:underline dark:text-amber-300"
            >
              Открыть помесячный обзор (февраль–март и осень) →
            </Link>
          </Card>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/kogda-sazhat-rassadu"
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Когда сажать рассаду
          </Link>
          <Link
            href="/guide"
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200"
          >
            Перейти в справочник культур
          </Link>
        </div>
      </div>
    </div>
  );
}
