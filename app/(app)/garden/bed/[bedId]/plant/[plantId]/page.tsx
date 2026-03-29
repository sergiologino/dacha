import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/gallery";
import { getAuthUser } from "@/lib/get-user";
import { notFound, redirect } from "next/navigation";
import { PlantPageClient } from "./plant-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bedId: string; plantId: string }>;
}): Promise<Metadata> {
  const { bedId, plantId } = await params;
  const user = await getAuthUser();
  const uid = user?.id ?? null;
  if (!uid) {
    return {
      title: "Растение | Мой огород",
      robots: { index: false, follow: false },
    };
  }
  const [bed, plant] = await Promise.all([
    prisma.bed.findFirst({ where: { id: bedId, userId: uid }, select: { name: true } }),
    prisma.plant.findFirst({
      where: { id: plantId, bedId, userId: uid },
      select: { name: true },
    }),
  ]);
  const title =
    plant && bed ? `${plant.name} — ${bed.name} | Уход и работы` : "Растение на грядке";
  return {
    title,
    description:
      plant && bed
        ? `«${plant.name}» на грядке «${bed.name}»: дата посадки, список работ по уходу и фото. «Любимая Дача».`
        : "Карточка растения.",
    keywords: [
      plant?.name ?? "растение",
      bed?.name ?? "грядка",
      "работы в огороде",
      "уход",
      "график поливов",
      "урожай",
    ],
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: plant && bed ? `План работ: ${plant.name}` : undefined,
      type: "website",
    },
    alternates: {
      canonical: `${getPublicAppUrl().replace(/\/$/, "")}/garden/bed/${bedId}/plant/${plantId}`,
    },
  };
}

export default async function GardenPlantPage({
  params,
}: {
  params: Promise<{ bedId: string; plantId: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth/signin");
  const { bedId, plantId } = await params;
  const plant = await prisma.plant.findFirst({
    where: { id: plantId, bedId, userId: user.id },
    select: { id: true },
  });
  if (!plant) notFound();
  return <PlantPageClient bedId={bedId} plantId={plantId} />;
}
