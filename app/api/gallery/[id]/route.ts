import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import type { GalleryPhoto } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const viewer = await getAuthUser().catch(() => null);
  const { id } = await params;

  const photo = await prisma.photo.findFirst({
    where: {
      id,
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
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        take: 50,
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const likedByViewer = viewer
    ? Boolean(
        await prisma.photoLike.findUnique({
          where: {
            photoId_userId: {
              photoId: photo.id,
              userId: viewer.id,
            },
          },
          select: { id: true },
        })
      )
    : false;

  const item: GalleryPhoto = {
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
    likedByViewer,
    comments: photo.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: {
        name: comment.user.name,
        image: comment.user.image,
      },
    })),
  };

  return NextResponse.json({ item });
}
