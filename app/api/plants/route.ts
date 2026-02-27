import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { generateTimelineForPlant } from "@/lib/timeline-generate";

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

    const { name, bedId, plantedDate, cropSlug } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Free plan: limit to 3 plants per user (total, across all beds)
    if (!user.isPremium) {
      const plantCount = await prisma.plant.count({
        where: { userId: user.id },
      });
      if (plantCount >= 3) {
        return NextResponse.json(
          {
            error:
              "Лимит бесплатной версии: не более 3 растений. Оформите Премиум, чтобы добавить больше.",
            code: "LIMIT_PLANTS_FREE",
          },
          { status: 402 }
        );
      }
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
        cropSlug: cropSlug || null,
      },
    });

    // Auto-generate timeline only if:
    // - user is Premium, or
    // - free user and this будет его первое растение с таймлайном
    if (user.isPremium) {
      generateTimelineForPlant(plant.id).catch((err) =>
        console.error("Timeline generation failed:", err)
      );
    } else {
      const existingTimelinePlant = await prisma.plantTimelineEvent.findFirst({
        where: {
          plant: {
            userId: user.id,
          },
        },
        select: { id: true },
      });

      if (!existingTimelinePlant) {
        generateTimelineForPlant(plant.id).catch((err) =>
          console.error("Timeline generation failed:", err)
        );
      }
    }

    return NextResponse.json(plant, { status: 201 });
  } catch (err) {
    console.error("Plants POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, plantedDate, name, notes, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Plant id is required" }, { status: 400 });
    }

    const plant = await prisma.plant.findFirst({ where: { id, userId: user.id } });
    if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

    const data: { plantedDate?: Date; name?: string; notes?: string; status?: string } = {};
    if (plantedDate != null) data.plantedDate = new Date(plantedDate);
    if (name != null) data.name = name;
    if (notes != null) data.notes = notes;
    if (status != null) data.status = status;

    const updated = await prisma.plant.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Plants PATCH error:", err);
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
