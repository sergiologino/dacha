import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { generateTimelineForPlant } from "@/lib/timeline-generate";

const DEMO_CROPS = [
  { name: "Томат, Черри", slug: "tomat" },
  { name: "Огурец, Зозуля F1", slug: "ogurets" },
] as const;

/**
 * POST /api/user/seed-demo-garden
 * Для новых пользователей (0 грядок) создаёт демо-грядку «Рассада дома» с одним растением
 * (томат или огурец из справочника), запускает генерацию таймлайна и добавляет одну ручную работу.
 * Идемпотентно: если у пользователя уже есть грядки — 200 без изменений.
 */
export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bedCount = await prisma.bed.count({ where: { userId: user.id } });
    if (bedCount > 0) {
      return NextResponse.json({ seeded: false });
    }

    const crop = DEMO_CROPS[Math.floor(Math.random() * DEMO_CROPS.length)];
    const plantedDate = new Date();

    const bed = await prisma.bed.create({
      data: {
        userId: user.id,
        name: "Рассада дома",
        type: "seedling_home",
      },
    });

    const plant = await prisma.plant.create({
      data: {
        userId: user.id,
        bedId: bed.id,
        name: crop.name,
        cropSlug: crop.slug,
        plantedDate,
      },
    });

    generateTimelineForPlant(plant.id).catch((err) =>
      console.error("Seed demo: timeline generation failed", err)
    );

    const inThreeDays = new Date(plantedDate);
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const maxOrder = await prisma.plantTimelineEvent.aggregate({
      where: { plantId: plant.id },
      _max: { sortOrder: true },
    });
    await prisma.plantTimelineEvent.create({
      data: {
        plantId: plant.id,
        type: "water",
        title: "Проверить влажность почвы",
        description: "Убедитесь, что грунт не пересушен. При необходимости полейте рассаду под корень.",
        scheduledDate: inThreeDays,
        isAction: true,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        isUserCreated: true,
      },
    });

    return NextResponse.json({ seeded: true, bedId: bed.id, plantId: plant.id }, { status: 201 });
  } catch (err) {
    console.error("Seed demo garden error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
