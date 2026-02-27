import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { generateTimelineForPlant } from "@/lib/timeline-generate";

export const dynamic = "force-dynamic";

export async function POST(
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

   // Free plan: timeline is available only for one plant per user.
   // Allow generating for this plant if:
   // - user is Premium, or
   // - free user and нет другого растения с событиями таймлайна.
   if (!user.isPremium) {
     const otherTimelinePlant = await prisma.plantTimelineEvent.findFirst({
       where: {
         plant: {
           userId: user.id,
           id: { not: plantId },
         },
       },
       select: { id: true },
     });

     if (otherTimelinePlant) {
       return NextResponse.json(
         {
           error:
             "Лимит бесплатной версии: таймлайн ухода доступен только для одного растения. Оформите Премиум, чтобы разблокировать таймлайн для всех растений.",
           code: "LIMIT_TIMELINE_FREE",
         },
         { status: 402 }
       );
     }
   }

  await generateTimelineForPlant(plantId);

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
