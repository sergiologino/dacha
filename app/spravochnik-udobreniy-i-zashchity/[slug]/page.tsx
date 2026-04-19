import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/seo";
import {
  getSpravochnikProductBySlug,
  getSpravochnikProductSlugs,
  SPRAVOCHNIK_SECTIONS,
} from "@/lib/data/spravochnik-udobreniy-products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getSpravochnikProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getSpravochnikProductBySlug(slug);
  if (!p) return { title: "Не найдено" };

  const path = `/spravochnik-udobreniy-i-zashchity/${slug}`;
  const title = `${p.name} — применение на огороде | Любимая Дача`;

  return {
    title,
    description: p.metaDescription,
    keywords: `${p.name}, удобрение для огорода, дача, ${p.subtitle}`,
    alternates: {
      canonical: absoluteUrl(path),
    },
    openGraph: {
      title: p.name,
      description: p.teaser,
      type: "article",
      locale: "ru_RU",
      url: absoluteUrl(path),
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description: p.teaser,
      images: ["/icons/icon-512.png"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function SpravochnikProductPage({ params }: Props) {
  const { slug } = await params;
  const p = getSpravochnikProductBySlug(slug);
  if (!p) notFound();

  const section = SPRAVOCHNIK_SECTIONS.find((s) => s.id === p.sectionId);
  const path = `/spravochnik-udobreniy-i-zashchity/${slug}`;
  const url = absoluteUrl(path);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-emerald-950 dark:via-slate-950 dark:to-lime-950">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: p.name,
          description: p.metaDescription,
          url,
          inLanguage: "ru-RU",
        }}
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
          <Link
            href="/spravochnik-udobreniy-i-zashchity"
            className="hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            Удобрения и защита
          </Link>
          {" / "}
          <span className="text-slate-600 dark:text-slate-400">{p.name}</span>
        </nav>

        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          {section?.title ?? "Справочник"}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{p.name}</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">{p.subtitle}</p>

        <div className="mt-8 space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
          {p.paragraphs.map((para, i) => (
            <p key={`${p.slug}-p-${i}`}>{para}</p>
          ))}
        </div>

        <Card className="mt-8 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Как применять</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
            {p.usage.map((u, i) => (
              <li key={`${p.slug}-u-${i}`}>{u}</li>
            ))}
          </ul>
        </Card>

        <Card className="mt-4 border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Важно</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {p.cautions.map((c, i) => (
              <li key={`${p.slug}-c-${i}`}>{c}</li>
            ))}
            <li>
              Дозировки, сроки ожидания до сбора урожая и класс опасности — <strong>только</strong> с этикетки
              вашей упаковки и действующего регламента.
            </li>
          </ul>
        </Card>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/spravochnik-udobreniy-i-zashchity"
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Ко всему справочнику
          </Link>
          <Link
            href="/guide"
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-500 dark:border-slate-600 dark:text-slate-200"
          >
            Справочник культур
          </Link>
        </div>
      </div>
    </div>
  );
}
