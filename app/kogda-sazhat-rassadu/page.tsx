import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/seo";

const cropRows = [
  {
    name: "Перец",
    timing: "середина февраля - начало марта",
    details: "Сладкий перец сеют одним из первых: культура медленно развивается и долго растёт до высадки.",
    href: "/guide/perets",
  },
  {
    name: "Баклажаны",
    timing: "середина февраля - начало марта",
    details: "Баклажанам нужно много тепла и длинный рассадный период, особенно в средней полосе.",
    href: "/guide/baklazhan",
  },
  {
    name: "Томаты",
    timing: "март",
    details: "Основной срок для томатов на рассаду - март. Ранние сорта можно сеять чуть позже, поздние - раньше.",
    href: "/guide/tomat",
  },
  {
    name: "Огурцы",
    timing: "апрель",
    details: "Огурцы не любят перерастания рассады, поэтому их обычно сеют за 20-25 дней до высадки.",
    href: "/guide/ogurets",
  },
  {
    name: "Лук эксибишен и лук-порей",
    timing: "февраль - март",
    details: "Лук-порей и эксибишен высевают рано, потому что у них длинный период развития до полноценной высадки и формирования крупных растений.",
    href: "/guide/luk-porey",
  },
  {
    name: "Петуния",
    timing: "февраль - март",
    details: "Петунию сеют рано из-за мелких семян и долгого развития до цветения.",
    href: "/guide/petuniya",
  },
];

const faq = [
  {
    question: "Когда сажать рассаду в 2026 году?",
    answer:
      "Для большинства популярных культур ориентир такой: перец и баклажаны сеют в феврале, томаты - в марте, огурцы - в апреле. Точный срок зависит от региона, теплицы и даты высадки в грунт.",
  },
  {
    question: "Когда сажать рассаду в Подмосковье?",
    answer:
      "В Подмосковье обычно придерживаются стандартной схемы средней полосы: перец и баклажаны - февраль, томаты - март, огурцы - апрель. В открытый грунт высаживают после риска заморозков.",
  },
  {
    question: "Когда сажать рассаду на Урале и в Сибири?",
    answer:
      "В более холодных регионах важнее не ранний посев, а корректная дата высадки. Часто рассаду сеют немного позже, чтобы она не перерастала до переноса в теплицу или грунт.",
  },
  {
    question: "Когда высаживать рассаду в открытый грунт?",
    answer:
      "Высадку проводят только после устойчивого тепла и прогрева почвы. Для теплолюбивых культур безопаснее сначала теплица, затем открытый грунт.",
  },
];

export const metadata: Metadata = {
  title: "Когда сажать рассаду в 2026 году — сроки по культурам",
  description:
    "Когда сажать рассаду в 2026 году: перец, томаты, баклажаны, огурцы, лук и петунию. Краткие сроки посева по месяцам и регионам России.",
  keywords:
    "когда сажать рассаду, когда сажать рассаду в 2026, когда сажать томаты на рассаду, когда сажать перец на рассаду",
  alternates: {
    canonical: absoluteUrl("/kogda-sazhat-rassadu"),
  },
  openGraph: {
    title: "Когда сажать рассаду в 2026 году",
    description:
      "Сроки посева рассады по основным культурам: перец, томаты, баклажаны, огурцы, лук и петуния.",
    type: "article",
    locale: "ru_RU",
    url: absoluteUrl("/kogda-sazhat-rassadu"),
  },
};

export default function SeedlingsSeoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Когда сажать рассаду в 2026 году",
            description:
              "Сроки посева рассады по основным культурам и регионам России.",
            url: absoluteUrl("/kogda-sazhat-rassadu"),
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
          <span>Когда сажать рассаду</span>
        </nav>

        <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Когда сажать рассаду в 2026 году
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Ниже собраны удобные ориентиры по основным культурам: когда сеять перец, баклажаны,
          томаты, огурцы, лук и петунию на рассаду. Точные сроки всегда стоит сверять с вашим
          регионом, погодой и тем, где растения будут расти дальше: в теплице или в открытом грунте.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {cropRows.map((item) => (
            <Card key={item.name} className="p-5">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{item.name}</h2>
              <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Когда сажать: {item.timing}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {item.details}
              </p>
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
              Один и тот же срок не подходит для всех регионов. В Подмосковье и средней полосе
              рассаду обычно сеют по базовому графику, а на Урале, в Сибири и в более прохладных
              районах сроки нередко смещают так, чтобы растения не переросли до высадки.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Если планируете теплицу, посев можно делать чуть раньше. Если выращивание будет в
              открытом грунте, безопаснее ориентироваться на последние заморозки и фактическое
              прогревание почвы весной.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold">Как выбрать точный срок</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Удобнее всего идти от даты будущей высадки: сначала понять, когда в вашем регионе
              обычно заканчиваются заморозки, а затем отсчитать назад нужное число дней для каждой
              культуры. Перец и баклажаны сеют раньше, томаты чуть позже, а огурцы ближе к моменту
              переноса в грунт или теплицу.
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
          <Link href="/kalendar-posadok-2026" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700">
            Смотреть календарь посадок 2026
          </Link>
          <Link href="/guide" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200">
            Открыть справочник культур
          </Link>
        </div>
      </div>
    </div>
  );
}
