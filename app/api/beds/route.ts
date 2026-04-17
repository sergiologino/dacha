import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import {
  hasFullAccess,
  isLegacyFreeTierUser,
  LEGACY_FREE_BED_LIMIT,
} from "@/lib/user-access";

export const dynamic = "force-dynamic";

const bedInclude = {
  plants: {
    orderBy: { createdAt: "desc" as const },
    include: {
      photos: { orderBy: { takenAt: "desc" as const } },
      timelineEvents: { orderBy: [{ scheduledDate: "asc" as const }, { sortOrder: "asc" as const }] },
    },
  },
  photos: { orderBy: { createdAt: "desc" as const }, take: 4 },
};

/** После удаления растения Prisma раньше обнулял plantId у фото — они пропадали с UI. Каскад это исправляет для новых данных; для уже «осиротевших» на грядке с одной культурой подмешиваем их в её photos. */
async function attachOrphanBedPhotosToSinglePlantBeds(
  userId: string,
  beds: Awaited<ReturnType<typeof prisma.bed.findMany<{ include: typeof bedInclude }>>>
) {
  for (const bed of beds) {
    const plants = bed.plants;
    if (plants.length !== 1) continue;
    const only = plants[0];
    if (!only) continue;

    const orphans = await prisma.photo.findMany({
      where: { userId, bedId: bed.id, plantId: null },
      orderBy: { takenAt: "desc" },
    });
    if (orphans.length === 0) continue;

    const existingIds = new Set((only.photos ?? []).map((p) => p.id));
    const merged = [
      ...orphans.filter((o) => !existingIds.has(o.id)),
      ...(only.photos ?? []),
    ].sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());

    only.photos = merged;
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const beds = await prisma.bed.findMany({
      where: { userId: user.id },
      include: bedInclude,
      orderBy: { createdAt: "desc" },
    });

    await attachOrphanBedPhotosToSinglePlantBeds(user.id, beds);

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

    if (hasFullAccess(user)) {
      // без ограничений
    } else if (isLegacyFreeTierUser(user)) {
      const bedCount = await prisma.bed.count({ where: { userId: user.id } });
      if (bedCount >= LEGACY_FREE_BED_LIMIT) {
        return NextResponse.json(
          {
            error:
              "Лимит бесплатной версии: не более 2 грядок. Оформите Премиум, чтобы добавить больше.",
            code: "LIMIT_BEDS_FREE",
          },
          { status: 402 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Пробный период закончился. Оформите подписку Премиум, чтобы добавлять грядки и пользоваться приложением.",
          code: "PAYMENT_REQUIRED",
        },
        { status: 402 }
      );
    }

    const bed = await prisma.bed.create({
      data: {
        userId: user.id,
        name,
        number: number || null,
        type: type || "open",
      },
      include: bedInclude,
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
      include: bedInclude,
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
