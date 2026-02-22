import { Metadata } from "next";
import { notFound } from "next/navigation";
import { crops } from "@/lib/data/crops";
import { CropDetailContent } from "./crop-detail";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return crops.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const crop = crops.find((c) => c.slug === slug);
  if (!crop) return {};

  return {
    title: `${crop.name} — как выращивать на даче | ДачаAI`,
    description: crop.description || crop.note,
    keywords: `${crop.name}, выращивание, дача, огород, посадка ${crop.name.toLowerCase()}, уход, сорта`,
  };
}

export default async function CropPage({ params }: Props) {
  const { slug } = await params;
  const crop = crops.find((c) => c.slug === slug);
  if (!crop) notFound();

  return <CropDetailContent crop={crop} />;
}
