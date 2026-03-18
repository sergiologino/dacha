import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (existing) {
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

  const likesCount = await prisma.photoLike.count({
    where: { photoId: id },
  });

  return NextResponse.json({
    liked: !existing,
    likesCount,
  });
}
