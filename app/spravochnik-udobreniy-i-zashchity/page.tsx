import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/seo";
import {
  SPRAVOCHNIK_SECTIONS,
  getSpravochnikProductsBySection,
} from "@/lib/data/spravochnik-udobreniy-products";

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
    "Удобрения для огорода и сада: Фертика, Фаско, Кристалон, нитроаммофоска, Фитоспорин и др. Кратко по каждому препарату и ссылки на подробные страницы.",
  keywords:
    "удобрения для огорода, нитроаммофоска, карбамид мочевина, Фертика, Фаско, Кристалон, Фитоспорин, Топаз фунгицид, средства защиты растений",
  alternates: {
    canonical: absoluteUrl("/spravochnik-udobreniy-i-zashchity"),
  },
  openGraph: {
    title: "Справочник удобрений и защиты растений",
    description: "Каталог популярных в РФ удобрений и препаратов защиты с подробными страницами.",
    type: "article",
    locale: "ru_RU",
    url: absoluteUrl("/spravochnik-udobreniy-i-zashchity"),
  },
};

export default function FertilizersAndProtectionGuidePage() {
  const url = absoluteUrl("/spravochnik-udobreniy-i-zashchity");

  const catalogItems = SPRAVOCHNIK_SECTIONS.flatMap((sec) =>
    getSpravochnikProductsBySection(sec.id).map((p) => ({
      name: p.name,
      url: `${url}/${p.slug}`,
    }))
  );

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
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Популярные удобрения и препараты защиты",
            numberOfItems: catalogItems.length,
            itemListElement: catalogItems.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.name,
              url: item.url,
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
          Ниже — виды удобрений и защиты с <strong>конкретными названиями</strong>, которые чаще всего встречаются в
          российских садовых маркетах и агрохимии. У каждого пункта есть краткое описание и ссылка на{" "}
          <strong>отдельную страницу</strong> с практическими пояснениями. Дозировки и регламенты — только с вашей
          упаковки. Для сроков посадки и ухода по культурам см.{" "}
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

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white/70 p-5 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Общие принципы</h2>
          <p className="mt-2">
            Органика (компост, биогумус, зола) задаёт фон почвы; минеральные соли и водорастворимые комплексы
            подключают по фазе развития растения. Азот усиливает зелёную массу, фосфор помогает корням и завязи, калий —
            качеству плодов. Микроэлементы и листовые подкормки — при симптомах или по анализу. Средства защиты не
            смешивайте «на глаз» с удобрениями в одной ёмкости, если это не разрешено инструкцией.
          </p>
        </section>

        <div className="mt-12 space-y-12">
          {SPRAVOCHNIK_SECTIONS.map((sec) => {
            const products = getSpravochnikProductsBySection(sec.id);
            if (products.length === 0) return null;
            return (
              <section key={sec.id}>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{sec.title}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{sec.hubIntro}</p>
                <ul className="mt-5 space-y-4">
                  {products.map((p) => (
                    <li key={p.slug}>
                      <Card className="p-4 transition hover:border-emerald-300 dark:hover:border-emerald-700">
                        <Link
                          href={`/spravochnik-udobreniy-i-zashchity/${p.slug}`}
                          className="text-base font-semibold text-emerald-800 hover:underline dark:text-emerald-300"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{p.subtitle}</p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{p.teaser}</p>
                        <Link
                          href={`/spravochnik-udobreniy-i-zashchity/${p.slug}`}
                          className="mt-2 inline-block text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          Подробнее →
                        </Link>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Безопасность</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Используйте СИЗ, не смешивайте неизвестные составы, храните препараты отдельно от пищи и детей. Соблюдайте
            срок ожидания до сбора урожая. Этот материал не заменяет инструкцию производителя и действующий регламент
            применения.
          </p>
        </section>

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
