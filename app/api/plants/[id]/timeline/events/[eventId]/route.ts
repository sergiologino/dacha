import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

const VALID_TYPES = new Set([
  "sprout", "transplant", "water", "loosen", "light_temp", "feed", "pinch", "harvest", "other",
]);

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: plantId, eventId } = await params;
  const event = await prisma.plantTimelineEvent.findFirst({
    where: { id: eventId, plantId },
    include: { plant: { select: { userId: true } } },
  });
  if (!event || event.plant.userId !== user.id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { title, description, scheduledDate, dateTo, isAction, type } = body;

  const data: {
    title?: string;
    description?: string | null;
    scheduledDate?: Date;
    dateTo?: Date | null;
    isAction?: boolean;
    type?: string;
  } = {};

  if (title !== undefined) {
    const t = typeof title === "string" ? title.trim() : "";
    if (!t) return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    data.title = t;
  }
  if (description !== undefined) {
    data.description = description != null && String(description).trim() ? String(description).trim() : null;
  }
  if (scheduledDate !== undefined) {
    const d = new Date(scheduledDate);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid scheduledDate" }, { status: 400 });
    data.scheduledDate = d;
  }
  if (dateTo !== undefined) {
    data.dateTo = dateTo == null || dateTo === "" ? null : (() => {
      const d = new Date(dateTo);
      return Number.isNaN(d.getTime()) ? null : d;
    })();
  }
  if (typeof isAction === "boolean") data.isAction = isAction;
  if (type !== undefined && VALID_TYPES.has(String(type))) data.type = String(type);

  const updated = await prisma.plantTimelineEvent.update({
    where: { id: eventId },
    data,
  });

  return NextResponse.json({
    id: updated.id,
    type: updated.type,
    title: updated.title,
    description: updated.description,
    scheduledDate: updated.scheduledDate.toISOString(),
    dateTo: updated.dateTo?.toISOString() ?? null,
    isAction: updated.isAction,
    sortOrder: updated.sortOrder,
    doneAt: updated.doneAt?.toISOString() ?? null,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: plantId, eventId } = await params;
  const event = await prisma.plantTimelineEvent.findFirst({
    where: { id: eventId, plantId },
    include: { plant: { select: { userId: true } } },
  });
  if (!event || event.plant.userId !== user.id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await prisma.plantTimelineEvent.delete({ where: { id: eventId } });
  return NextResponse.json({ success: true });
}
