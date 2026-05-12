import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { generateTimelineForPlant } from "@/lib/timeline-generate";
import {
  hasFullAccess,
  isLegacyFreeTierUser,
  LEGACY_FREE_PLANT_LIMIT,
} from "@/lib/user-access";
import { tryRemoveStoredFile } from "@/lib/photo-storage";
import { ensureVirtualBed, parsePlacementType } from "@/lib/virtual-beds";
import { assertOwnerCanDeletePlants, familyOwnerIdFor, getFamilyAccessUser } from "@/lib/family-access";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ownerId = familyOwnerIdFor(user);

    const plants = await prisma.plant.findMany({
      where: { userId: ownerId },
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
    const ownerId = familyOwnerIdFor(user);
    const accessUser = await getFamilyAccessUser(user);

    const { name, bedId, plantedDate, cropSlug, placementType } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (hasFullAccess(accessUser)) {
      // ok
    } else if (isLegacyFreeTierUser(accessUser)) {
      const plantCount = await prisma.plant.count({ where: { userId: ownerId } });
      if (plantCount >= LEGACY_FREE_PLANT_LIMIT) {
        return NextResponse.json(
          {
            error:
              "Лимит бесплатной версии: не более 3 растений. Оформите Премиум, чтобы добавить больше.",
            code: "LIMIT_PLANTS_FREE",
          },
          { status: 402 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Пробный период закончился. Оформите подписку Премиум, чтобы добавлять растения и пользоваться приложением.",
          code: "PAYMENT_REQUIRED",
        },
        { status: 402 }
      );
    }

    let resolvedBedId: string | null = null;

    if (bedId) {
      const bed = await prisma.bed.findFirst({ where: { id: bedId, userId: ownerId } });
      if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 });
      resolvedBedId = bed.id;
    } else if (placementType != null) {
      const parsedPlacementType = parsePlacementType(placementType);
      if (!parsedPlacementType) {
        return NextResponse.json({ error: "Invalid placement type" }, { status: 400 });
      }
      const virtualBed = await ensureVirtualBed(ownerId, parsedPlacementType);
      resolvedBedId = virtualBed.id;
    }

    const plant = await prisma.plant.create({
      data: {
        userId: ownerId,
        name,
        bedId: resolvedBedId,
        plantedDate: plantedDate ? new Date(plantedDate) : new Date(),
        cropSlug: cropSlug || null,
      },
    });

    if (hasFullAccess(accessUser)) {
      generateTimelineForPlant(plant.id).catch((err) =>
        console.error("Timeline generation failed:", err)
      );
    } else if (isLegacyFreeTierUser(accessUser)) {
      const existingTimelinePlant = await prisma.plantTimelineEvent.findFirst({
        where: { plant: { userId: ownerId } },
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
    const ownerId = familyOwnerIdFor(user);

    const body = await request.json();
    const { id, plantedDate, name, notes, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Plant id is required" }, { status: 400 });
    }

    const plant = await prisma.plant.findFirst({ where: { id, userId: ownerId } });
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
    const ownerId = familyOwnerIdFor(user);
    if (!assertOwnerCanDeletePlants(user)) {
      return NextResponse.json(
        { error: "Удалять посаженные культуры может только владелец семейного аккаунта." },
        { status: 403 }
      );
    }

    const { id } = await request.json();

    const plant = await prisma.plant.findFirst({ where: { id, userId: ownerId } });
    if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

    const photoRows = await prisma.photo.findMany({
      where: { plantId: id },
      select: { url: true },
    });
    for (const { url } of photoRows) {
      await tryRemoveStoredFile(url);
    }

    await prisma.plant.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Plants DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
