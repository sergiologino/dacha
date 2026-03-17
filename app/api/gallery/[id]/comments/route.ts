import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
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

  const body = await request.json().catch(() => ({}));
  const content =
    typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "Comment is required" }, { status: 400 });
  }

  if (content.length > 400) {
    return NextResponse.json(
      { error: "Комментарий слишком длинный" },
      { status: 400 }
    );
  }

  const comment = await prisma.photoComment.create({
    data: {
      photoId: id,
      userId: user.id,
      content,
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  const commentsCount = await prisma.photoComment.count({
    where: { photoId: id },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: {
        name: comment.user.name,
        image: comment.user.image,
      },
    },
    commentsCount,
  });
}
