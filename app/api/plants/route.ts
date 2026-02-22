import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plants = await prisma.plant.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plants);
  } catch (err) {
    console.error("Plants GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, bedId, plantedDate } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (bedId) {
      const bed = await prisma.bed.findFirst({ where: { id: bedId, userId: user.id } });
      if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    const plant = await prisma.plant.create({
      data: {
        userId: user.id,
        name,
        bedId: bedId || null,
        plantedDate: plantedDate ? new Date(plantedDate) : new Date(),
      },
    });

    return NextResponse.json(plant, { status: 201 });
  } catch (err) {
    console.error("Plants POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();

    const plant = await prisma.plant.findFirst({ where: { id, userId: user.id } });
    if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

    await prisma.plant.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Plants DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
