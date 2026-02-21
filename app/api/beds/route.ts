import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const beds = await prisma.bed.findMany({
    where: { userId: user.id },
    include: {
      plants: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { createdAt: "desc" }, take: 4 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(beds);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { name, number, type } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const bed = await prisma.bed.create({
    data: {
      userId: user.id,
      name,
      number: number || null,
      type: type || "open",
    },
    include: { plants: true, photos: true },
  });

  return NextResponse.json(bed, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await request.json();
  const bed = await prisma.bed.findFirst({ where: { id, userId: user.id } });
  if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 });

  await prisma.bed.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
