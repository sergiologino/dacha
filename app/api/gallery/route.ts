import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import type { GalleryPhoto } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getAuthUser().catch(() => null);

  const photos = await prisma.photo.findMany({
    where: {
      isPublic: true,
      publishedAt: { not: null },
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      plant: {
        select: {
          name: true,
          cropSlug: true,
        },
      },
      bed: {
        select: {
          name: true,
          type: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 40,
  });

  const likedIds = viewer
    ? new Set(
        (
          await prisma.photoLike.findMany({
            where: {
              userId: viewer.id,
              photoId: { in: photos.map((photo) => photo.id) },
            },
            select: { photoId: true },
          })
        ).map((item) => item.photoId)
      )
    : new Set<string>();

  const items: GalleryPhoto[] = photos.map((photo) => ({
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    publishedAt: photo.publishedAt?.toISOString() ?? null,
    takenAt: photo.takenAt.toISOString(),
    analysisResult: photo.analysisResult,
    analysisStatus: photo.analysisStatus,
    plantName: photo.plant?.name ?? null,
    cropSlug: photo.plant?.cropSlug ?? null,
    bedName: photo.bed?.name ?? null,
    bedType: photo.bed?.type ?? null,
    user: {
      name: photo.user.name,
      image: photo.user.image,
    },
    likesCount: photo._count.likes,
    commentsCount: photo._count.comments,
    likedByViewer: likedIds.has(photo.id),
  }));

  return NextResponse.json({ items });
}
