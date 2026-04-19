import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/seo";

const faq = [
  {
    question: "Какие удобрения нужны огороду весной и летом?",
    answer:
      "Обычно сочетают органику (компост, перегной) с минеральными подкормками по фазам: азот в начале роста, фосфор и калий перед цветением и плодоношением. Точная доза зависит от анализа почвы и культуры.",
  },
  {
    question: "Чем обработать растения от тли и колорадского жука?",
    answer:
      "Сначала пробуют механику и биопрепараты (например, на основе полезных организмов), мыльные растворы для тли. Химические инсектициды — по необходимости, строго по инструкции и с учётом срока ожидания до сбора урожая.",
  },
  {
    question: "Что такое бордосская жидкость и когда её применяют?",
    answer:
      "Это медьсодержащее средство для профилактики и борьбы с грибковыми заболеваниями по вегетации. Концентрацию и время обработок выбирают по инструкции и погоде, избегая жары и цветения полезных насекомых.",
  },
  {
    question: "Можно ли совмещать удобрения и средства защиты?",
    answer:
      "Не все сочетания совместимы. Не смешивайте препараты без указания в инструкции. Часто удобрения и защиту разносят по разным поливам или дням.",
  },
];

export const metadata: Metadata = {
  title:
    "Справочник удобрений и средств защиты растений — вредители, болезни, подкормки | Любимая Дача",
  description:
    "Удобрения для огорода и сада: органика, NPK, микроэлементы. Средства защиты от вредителей и болезней томатов, огурцов, картофеля: профилактика, биопрепараты, безопасное применение.",
  keywords:
    "удобрения для огорода, подкормка томатов и огурцов, средства защиты растений, вредители огорода, болезни томатов фитофтороз, бордосская жидкость, биопрепараты для растений",
  alternates: {
    canonical: absoluteUrl("/spravochnik-udobreniy-i-zashchity"),
  },
  openGraph: {
    title: "Справочник удобрений и защиты растений",
    description: "Подкормки, вредители и болезни: практичный обзор для дачника.",
    type: "article",
    locale: "ru_RU",
    url: absoluteUrl("/spravochnik-udobreniy-i-zashchity"),
  },
};

export default function FertilizersAndProtectionGuidePage() {
  const url = absoluteUrl("/spravochnik-udobreniy-i-zashchity");

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-emerald-950 dark:via-slate-950 dark:to-lime-950">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Справочник удобрений и средств защиты растений для дачи",
            description:
              "Органические и минеральные удобрения, средства борьбы с вредителями и болезнями огородных культур.",
            url,
            inLanguage: "ru-RU",
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          },
        ]}
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Главная
          </Link>
          {" / "}
          <Link href="/guide" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Справочник
          </Link>
          {" / "}
          <span>Удобрения и защита</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Справочник удобрений и средств защиты растений
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Краткий ориентир для дачника: чем подкармливать грядки без «химического перегруза», как снизить
          риск болезней и что учитывать при работе с вредителями. Для сроков посадки и ухода по культурам
          используйте{" "}
          <Link href="/guide" className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400">
            основной справочник
          </Link>{" "}
          и{" "}
          <Link
            href="/kalendar-posadok-2026"
            className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            календарь посадок
          </Link>
          .
        </p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Органические удобрения</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Компост и перегной</strong> — базис плодородия: улучшают структуру почвы и дают
                медленное питание. Вносят под перекопку или локально под посадку.
              </li>
              <li>
                <strong>Зола</strong> — источник калия и части микроэлементов; дозировка зависит от типа почвы
                и культуры. Не сочетать с известью и аммиачной селитрой без расчёта кислотности.
              </li>
              <li>
                <strong>Настои</strong> (крапива, коровяк и др.) — осторожно с концентрацией, чтобы не обжечь
                корни. Чаще используют как дополнение, а не единственный источник питания.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Минеральные подкормки (NPK)</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Азот стимулирует зелёную массу, фосфор помогает корням и завязи, калий укрепляет растение и
              влияет на качество плодов. На практике важно не переборщить с азотом перед плодоношением у
              томатов и огурцов — это может усилить нежность тканей и привлечь вредителей. Готовые смеси для
              овощей удобны, но читайте дозировку на упаковке и учитывайте уже внесённую органику.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Микроэлементы</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Дефицит бора, магния, железа и других элементов проявляется точечно: хлороз листьев, трещины
              плодов, «стеклянная» кожица. Листовые подкормки иногда помогают быстрее, но сначала стоит
              исключить перелив, загущение посадок и вредителей — симптомы могут быть похожи.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Биопрепараты и стимуляторы
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Препараты на основе полезных бактерий и грибов помогают подавить часть патогенов и улучшить
              усвоение питания. Они редко дают «мгновенный эффект», зато хорошо вписываются в профилактику.
              Соблюдайте температурный режим и сроки обработки из инструкции.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Вредители огорода</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Тля</strong> — смывание струей воды, мыльно-зольные растворы, привлечение полезных
                насекомых; при массовом поражении — препараты по инструкции с учётом опылителей.
              </li>
              <li>
                <strong>Колорадский жук</strong> — регулярный сбор, глубокое окучивание, биопрепараты;
                инсектициды — осознанно, с ротацией действующих веществ.
              </li>
              <li>
                <strong>Паутинный клещ</strong> — повышение влажности, смыв, своевременная обрезка
                заросших участков; акарициды — при необходимости.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Болезни растений</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              <strong>Фитофтороз, мучнистая роса, серая гниль</strong> чаще ловят там, где плохой воздух,
              избыток влаги и загущение. Начинайте с режима полива, мульчи и прореживания.               Медьсодержащие и
              другие фунгициды применяют по регламенту; бордосская жидкость и аналоги — классика, но
              чувствительны к передозировке и времени суток обработки.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Безопасность</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Используйте СИЗ, не смешивайте неизвестные составы, храните препараты отдельно от пищи и детей.
              Соблюдайте срок ожидания до сбора урожая. При сомнениях — консультируйтесь с региональными
              справочниками и специалистами; этот текст не заменяет инструкции производителя.
            </p>
          </section>
        </div>

        <Card className="mt-12 p-6 border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Смотрите также</h2>
          <ul className="mt-3 space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
            <li>
              <Link href="/guide" className="hover:underline">
                Справочник культур — сроки и уход
              </Link>
            </li>
            <li>
              <Link href="/kogda-sazhat-rassadu" className="hover:underline">
                Когда сажать и высаживать рассаду (весна 2026)
              </Link>
            </li>
            <li>
              <Link href="/facts" className="hover:underline">
                Интересные факты о растениях
              </Link>
            </li>
          </ul>
        </Card>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="text-2xl font-semibold">Вопросы и ответы</h2>
          <div className="mt-6 space-y-5">
            {faq.map((item) => (
              <div key={item.question}>
                <h3 className="text-lg font-medium text-slate-950 dark:text-white">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
