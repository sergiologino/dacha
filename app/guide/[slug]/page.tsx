import { Metadata } from "next";
import { notFound } from "next/navigation";
import { crops as staticCrops } from "@/lib/data/crops";
import { prisma } from "@/lib/prisma";
import { CropDetailContent } from "./crop-detail";
import type { Crop } from "@/lib/types";

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
  const crop = staticCrops.find((c) => c.slug === slug) ?? await prisma.crop.findUnique({ where: { slug } }).then((r) => r ? dbRowToCrop(r) : null);
  if (!crop) return {};

  return {
    title: `${crop.name} — как выращивать на даче | Любимая Дача`,
    description: crop.description || crop.note,
    keywords: `${crop.name}, выращивание, дача, огород, посадка ${crop.name.toLowerCase()}, уход, сорта`,
  };
}

export default async function CropPage({ params }: Props) {
  const { slug } = await params;
  let crop: (Crop & { addedByCommunity?: boolean }) | null = staticCrops.find((c) => c.slug === slug) ?? null;
  if (!crop) {
    const row = await prisma.crop.findUnique({ where: { slug } });
    crop = row ? dbRowToCrop(row) : null;
  }
  if (!crop) notFound();

  return <CropDetailContent crop={crop} />;
}
