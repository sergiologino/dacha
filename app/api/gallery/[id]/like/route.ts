import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const setLiked =
    typeof body.setLiked === "boolean" ? (body.setLiked as boolean) : null;

  const { id } = await params;
  const photo = await prisma.photo.findFirst({
    where: {
      id,
      isPublic: true,
      publishedAt: { not: null },
    },
    select: { id: true },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const existing = await prisma.photoLike.findUnique({
    where: {
      photoId_userId: {
        photoId: id,
        userId: user.id,
      },
    },
    select: { id: true },
  });

  if (setLiked === true) {
    if (!existing) {
      await prisma.photoLike.create({
        data: { photoId: id, userId: user.id },
      });
    }
  } else if (setLiked === false) {
    if (existing) {
      await prisma.photoLike.delete({
        where: {
          photoId_userId: { photoId: id, userId: user.id },
        },
      });
    }
  } else if (existing) {
    await prisma.photoLike.delete({
      where: {
        photoId_userId: {
          photoId: id,
          userId: user.id,
        },
      },
    });
  } else {
    await prisma.photoLike.create({
      data: {
        photoId: id,
        userId: user.id,
      },
    });
  }

  const likedAfter =
    setLiked === true ? true : setLiked === false ? false : !existing;

  const likesCount = await prisma.photoLike.count({
    where: { photoId: id },
  });

  return NextResponse.json({
    liked: likedAfter,
    likesCount,
  });
}
