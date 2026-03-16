import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { crops as staticCrops } from "@/lib/data/crops";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { CropDetailContent } from "./crop-detail";
import type { Crop } from "@/lib/types";

/** Страница культуры подгружается из БД при неизвестном slug (добавленные дачниками). */
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function dbRowToCrop(row: {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  plantMonths: string[];
  harvestMonths: string[];
  waterSchedule: string | null;
  regions: string[];
  careNotes: string | null;
  imageUrl: string | null;
  varieties: unknown;
}): Crop & { addedByCommunity?: boolean } {
  const varieties = Array.isArray(row.varieties)
    ? (row.varieties as { name: string; desc: string }[])
    : undefined;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description ?? undefined,
    region: row.regions ?? [],
    plantMonth: row.plantMonths?.[0] ?? "",
    harvestMonth: row.harvestMonths?.[0] ?? "",
    water: row.waterSchedule ?? "",
    note: row.careNotes ?? "",
    imageUrl: row.imageUrl ?? undefined,
    varieties,
    addedByCommunity: true,
  };
}

export async function generateStaticParams() {
  return staticCrops.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let crop: (Crop & { addedByCommunity?: boolean }) | null = staticCrops.find((c) => c.slug === slug) ?? null;
  if (!crop) {
    try {
      const row = await prisma.crop.findUnique({ where: { slug } });
      crop = row ? dbRowToCrop(row) : null;
    } catch {
      crop = null;
    }
  }
  if (!crop) return {};

  const description =
    crop.description ||
    `${crop.name}: когда сажать, как выращивать, когда высаживать в грунт и как ухаживать на даче.`;

  return {
    title: `${crop.name}: когда сажать и как выращивать | Любимая Дача`,
    description,
    keywords: `${crop.name}, когда сажать ${crop.name.toLowerCase()}, выращивание ${crop.name.toLowerCase()}, посадка ${crop.name.toLowerCase()}, уход, сорта`,
    alternates: {
      canonical: absoluteUrl(`/guide/${crop.slug}`),
    },
    openGraph: {
      title: `${crop.name}: когда сажать и как выращивать`,
      description,
      type: "article",
      locale: "ru_RU",
      url: absoluteUrl(`/guide/${crop.slug}`),
      images: crop.imageUrl ? [{ url: crop.imageUrl, alt: crop.name }] : undefined,
    },
  };
}

export default async function CropPage({ params }: Props) {
  const { slug } = await params;
  let crop: (Crop & { addedByCommunity?: boolean }) | null = staticCrops.find((c) => c.slug === slug) ?? null;
  if (!crop) {
    try {
      const row = await prisma.crop.findUnique({ where: { slug } });
      crop = row ? dbRowToCrop(row) : null;
    } catch {
      crop = null;
    }
  }
  if (!crop) notFound();

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${crop.name}: когда сажать и как выращивать`,
            description:
              crop.description ||
              `${crop.name}: когда сажать, как выращивать и как ухаживать на даче.`,
            url: absoluteUrl(`/guide/${crop.slug}`),
            inLanguage: "ru-RU",
            image: crop.imageUrl ? [crop.imageUrl] : undefined,
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: `Когда сажать ${crop.name.toLowerCase()}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `${crop.name} обычно сажают в ${crop.plantMonth.toLowerCase()}.`,
                },
              },
              {
                "@type": "Question",
                name: `Когда собирать урожай ${crop.name.toLowerCase()}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Ориентировочный период сбора урожая: ${crop.harvestMonth.toLowerCase()}.`,
                },
              },
              {
                "@type": "Question",
                name: `Какой полив нужен для ${crop.name.toLowerCase()}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Рекомендуемый режим полива: ${crop.water}.`,
                },
              },
            ],
          },
        ]}
      />
      <CropDetailContent crop={crop} />
    </>
  );
}
