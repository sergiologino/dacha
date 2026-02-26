import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
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

  const events = await prisma.plantTimelineEvent.findMany({
    where: { plantId },
    orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(
    events.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      scheduledDate: e.scheduledDate.toISOString(),
      dateTo: e.dateTo?.toISOString() ?? null,
      isAction: e.isAction,
      sortOrder: e.sortOrder,
      doneAt: e.doneAt?.toISOString() ?? null,
    }))
  );
}
