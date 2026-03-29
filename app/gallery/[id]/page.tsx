import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { galleryPhotoImageAbsoluteUrl } from "@/lib/gallery";
import { GalleryPostClient } from "./gallery-post-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const photo = await prisma.photo.findFirst({
    where: {
      id,
      isPublic: true,
      publishedAt: { not: null },
    },
    include: {
      plant: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!photo) {
    return {
      title: "Публикация не найдена",
    };
  }

  const title = photo.plant?.name
    ? `${photo.plant.name} — фото из галереи`
    : "Фото из галереи дачников";
  const description =
    photo.caption ||
    photo.analysisResult ||
    "Реальное фото растения из галереи пользователей Любимая Дача.";

  return {
    title,
    description,
    alternates: {
      canonical: `/gallery/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://dacha-ai.ru/gallery/${id}`,
      siteName: "Любимая Дача",
      type: "article",
      images: photo.url.startsWith("data:")
        ? undefined
        : [{ url: galleryPhotoImageAbsoluteUrl(id), alt: title }],
    },
  };
}

export default async function GalleryPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GalleryPostClient photoId={id} />;
}
