import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const beds = await prisma.bed.findMany({
      where: { userId: user.id },
      include: {
        plants: {
          orderBy: { createdAt: "desc" },
          include: {
            photos: { orderBy: { takenAt: "desc" } },
            timelineEvents: { orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }] },
          },
        },
        photos: { orderBy: { createdAt: "desc" }, take: 4 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(beds);
  } catch (err) {
    console.error("Beds GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  } catch (err) {
    console.error("Beds POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, name, number, type } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const bed = await prisma.bed.findFirst({ where: { id, userId: user.id } });
    if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 });

    const data: { name?: string; number?: string | null; type?: string } = {};
    if (name !== undefined) data.name = String(name).trim() || bed.name;
    if (number !== undefined) data.number = number === "" || number == null ? null : String(number);
    if (type !== undefined) data.type = String(type);

    const updated = await prisma.bed.update({
      where: { id },
      data,
      include: {
        plants: {
          orderBy: { createdAt: "desc" },
          include: {
            photos: { orderBy: { takenAt: "desc" } },
            timelineEvents: { orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }] },
          },
        },
        photos: { orderBy: { createdAt: "desc" }, take: 4 },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Beds PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    const bed = await prisma.bed.findFirst({ where: { id, userId: user.id } });
    if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 });

    await prisma.bed.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Beds DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
