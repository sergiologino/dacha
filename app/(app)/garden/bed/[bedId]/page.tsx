import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/gallery";
import { notFound, redirect } from "next/navigation";
import { BedPageClient } from "./bed-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bedId: string }>;
}): Promise<Metadata> {
  const { bedId } = await params;
  const session = await auth();
  const uid = typeof session?.user?.id === "string" ? session.user.id : null;
  if (!uid) {
    return {
      title: "Грядка | Мой огород",
      robots: { index: false, follow: false },
    };
  }
  const bed = await prisma.bed.findFirst({
    where: { id: bedId, userId: uid },
    select: { name: true },
  });
  const title = bed ? `${bed.name} — грядка и растения` : "Грядка";
  return {
    title,
    description: bed
      ? `Растения на грядке «${bed.name}»: культуры, даты посадки и уход. Личный кабинет «Любимая Дача».`
      : "Карточка грядки на вашем участке.",
    keywords: ["грядка", bed?.name ?? "огород", "растения", "посадка", "урожай", "огороднику"],
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: bed ? `Учёт растений на грядке «${bed.name}».` : undefined,
      type: "website",
    },
    alternates: { canonical: `${getPublicAppUrl().replace(/\/$/, "")}/garden/bed/${bedId}` },
  };
}

export default async function GardenBedPage({
  params,
}: {
  params: Promise<{ bedId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const { bedId } = await params;
  const ok = await prisma.bed.findFirst({
    where: { id: bedId, userId: session.user.id },
    select: { id: true },
  });
  if (!ok) notFound();
  return <BedPageClient bedId={bedId} />;
}
