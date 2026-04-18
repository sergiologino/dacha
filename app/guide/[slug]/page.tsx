import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import {
  type CommunityCropRow,
  findMatchingStaticCropBySlugOrName,
  getCropDisplayImageUrl,
  mapCommunityCropRow,
  mergeCropWithCommunityData,
} from "@/lib/crop-community";
import { crops as staticCrops } from "@/lib/data/crops";
import { prisma } from "@/lib/prisma";
import { proxifyGuideMediaUrl } from "@/lib/guide-image-url";
import { absoluteUrl } from "@/lib/seo";
import { CropDetailContent } from "./crop-detail";
import type { Crop } from "@/lib/types";

/** Страница культуры подгружается из БД при неизвестном slug (добавленные дачниками). */
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function resolveCropBySlug(slug: string): Promise<(Crop & { addedByCommunity?: boolean }) | null> {
  const staticCrop = staticCrops.find((c) => c.slug === slug) ?? null;

  let dbRow: CommunityCropRow | null = null;
  try {
    dbRow = await prisma.crop.findUnique({ where: { slug } });
  } catch {
    dbRow = null;
  }

  if (staticCrop && dbRow) {
    return {
      ...mergeCropWithCommunityData(staticCrop, dbRow),
      addedByCommunity: true,
    };
  }

  if (staticCrop) {
    return staticCrop;
  }

  if (dbRow) {
    const baseStatic = findMatchingStaticCropBySlugOrName(dbRow.name);
    if (baseStatic) {
      return {
        ...mergeCropWithCommunityData(baseStatic, dbRow),
        addedByCommunity: true,
      };
    }

    return {
      ...mapCommunityCropRow(dbRow),
      addedByCommunity: true,
    };
  }

  return null;
}

export async function generateStaticParams() {
  return staticCrops.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const crop = await resolveCropBySlug(slug);
  if (!crop) return {};

  const description =
    crop.description ||
    `${crop.name}: когда сажать, как выращивать, когда высаживать в грунт и как ухаживать на даче.`;

  const previewImg = getCropDisplayImageUrl(crop);
  const ogImage =
    previewImg && !previewImg.startsWith("data:")
      ? absoluteUrl(proxifyGuideMediaUrl(previewImg))
      : undefined;

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
      images: ogImage ? [{ url: ogImage, alt: crop.name }] : undefined,
    },
  };
}

export default async function CropPage({ params }: Props) {
  const { slug } = await params;
  const crop = await resolveCropBySlug(slug);
  if (!crop) notFound();

  const previewImg = getCropDisplayImageUrl(crop);
  const schemaImage =
    previewImg && !previewImg.startsWith("data:")
      ? [absoluteUrl(proxifyGuideMediaUrl(previewImg))]
      : undefined;

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
            image: schemaImage,
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
