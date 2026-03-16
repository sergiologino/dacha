import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { calendarTasks, monthNames } from "@/lib/data/calendar-tasks";
import { absoluteUrl } from "@/lib/seo";

const featuredMonths = [2, 3, 4, 5, 9, 10];

const faq = [
  {
    question: "Что сажать в феврале 2026 года?",
    answer:
      "В феврале чаще всего сеют перец, баклажаны, часть поздних томатов, сельдерей и часть цветочных культур для рассады.",
  },
  {
    question: "Что сажать в марте 2026 года?",
    answer:
      "Март - основной месяц для томатов на рассаду, ранней капусты и части цветочных культур. Также готовят теплицу к сезону.",
  },
  {
    question: "Когда высаживать рассаду в теплицу и открытый грунт?",
    answer:
      "В теплицу рассаду обычно переносят раньше, когда ночные температуры стабильно выше +10°C. В открытый грунт высаживают только после риска возвратных заморозков.",
  },
  {
    question: "Нужен ли лунный календарь посадок 2026?",
    answer:
      "Запросы по лунному календарю заметны, но практическая польза обычно выше от сочетания трёх факторов: региона, прогрева почвы и прогноза погоды. Лунный фактор можно использовать как дополнительный, а не основной.",
  },
];

export const metadata: Metadata = {
  title: "Календарь посадок 2026 для дачи и огорода",
  description:
    "Календарь посадок 2026: что сажать в феврале, марте, апреле и мае, когда высаживать рассаду в теплицу и открытый грунт.",
  keywords:
    "календарь посадок 2026, когда сажать в феврале 2026, когда сажать рассаду в 2026, лунный календарь посадок 2026",
  alternates: {
    canonical: absoluteUrl("/kalendar-posadok-2026"),
  },
  openGraph: {
    title: "Календарь посадок 2026",
    description:
      "Сроки посева и высадки рассады по месяцам: февраль, март, апрель, май и осенние работы.",
    type: "article",
    locale: "ru_RU",
    url: absoluteUrl("/kalendar-posadok-2026"),
  },
};

export default function PlantingCalendarSeoPage() {
  const monthBlocks = featuredMonths.map((month) => ({
    month,
    title: monthNames[month - 1],
    tasks: calendarTasks.filter((task) => task.month === month).slice(0, 4),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Календарь посадок 2026 для дачи и огорода",
            description:
              "Что сажать по месяцам, когда высаживать рассаду в теплицу и открытый грунт.",
            url: absoluteUrl("/kalendar-posadok-2026"),
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
          <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Главная</Link>
          {" / "}
          <span>Календарь посадок 2026</span>
        </nav>

        <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Календарь посадок 2026 для дачи и огорода
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          В собранной семантике очень высокий спрос на кластеры
          <strong> календарь посадки рассады</strong>, <strong>когда сажать в феврале</strong>,
          <strong> когда сажать в марте</strong> и <strong>лунный календарь 2026</strong>.
          Поэтому эта страница даёт компактный помесячный каркас, который помогает быстрее
          понять сезонные сроки и перейти к подробным культурам.
        </p>

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
              Отдельный кластер по лунному календарю важен для трафика, но для качества сниппета и
              доверия лучше прямо объяснять пользователю, что итоговый срок посадки должен опираться
              на погоду, регион, тип теплицы и прогрев почвы. Такой подход снижает риск лишних показов
              по слишком абстрактным запросам.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold">Что делать дальше</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              После календарной страницы пользователь обычно ищет одну из конкретных культур:
              томаты, перец, огурцы, баклажаны, лук, петунию. Поэтому следующий шаг - перейти в
              справочник и открыть детальную страницу культуры со сроками посадки и базовым уходом.
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

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/kogda-sazhat-rassadu" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700">
            Когда сажать рассаду
          </Link>
          <Link href="/guide" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200">
            Перейти в справочник культур
          </Link>
        </div>
      </div>
    </div>
  );
}
