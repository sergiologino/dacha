import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

const VALID_TYPES = new Set([
  "sprout", "transplant", "water", "loosen", "light_temp", "feed", "pinch", "harvest", "other",
]);

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: plantId } = await params;
  const plant = await prisma.plant.findFirst({
    where: { id: plantId, userId: user.id },
    select: { id: true },
  });
  if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

  // Бесплатный тариф: не более 5 пользовательских добавлений работ (isUserCreated)
  if (!user.isPremium) {
    const userCreatedCount = await prisma.plantTimelineEvent.count({
      where: {
        plant: { userId: user.id },
        isUserCreated: true,
      },
    });
    if (userCreatedCount >= 5) {
      return NextResponse.json(
        {
          error:
            "Лимит бесплатной версии: не более 5 добавленных вручную работ. Оформите Премиум, чтобы добавлять любое количество.",
          code: "LIMIT_PLANNED_WORKS_FREE",
        },
        { status: 402 }
      );
    }
  }

  const body = await request.json().catch(() => ({}));
  const { title, description, scheduledDate, dateTo, isAction, type } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!scheduledDate) {
    return NextResponse.json({ error: "scheduledDate is required" }, { status: 400 });
  }

  const eventType = type && VALID_TYPES.has(String(type)) ? String(type) : "other";
  const scheduled = new Date(scheduledDate);
  if (Number.isNaN(scheduled.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledDate" }, { status: 400 });
  }
  let dateToVal: Date | null = null;
  if (dateTo != null) {
    dateToVal = new Date(dateTo);
    if (Number.isNaN(dateToVal.getTime())) dateToVal = null;
  }

  const maxOrder = await prisma.plantTimelineEvent.aggregate({
    where: { plantId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const event = await prisma.plantTimelineEvent.create({
    data: {
      plantId,
      type: eventType,
      title: title.trim(),
      description: description != null && String(description).trim() ? String(description).trim() : null,
      scheduledDate: scheduled,
      dateTo: dateToVal,
      isAction: typeof isAction === "boolean" ? isAction : true,
      sortOrder,
      isUserCreated: true,
    },
  });

  return NextResponse.json({
    id: event.id,
    type: event.type,
    title: event.title,
    description: event.description,
    scheduledDate: event.scheduledDate.toISOString(),
    dateTo: event.dateTo?.toISOString() ?? null,
    isAction: event.isAction,
    sortOrder: event.sortOrder,
    doneAt: event.doneAt?.toISOString() ?? null,
  }, { status: 201 });
}
