import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import {
  hasFullAccess,
  isLegacyFreeTierUser,
  LEGACY_FREE_PLANNED_WORKS_LIMIT,
} from "@/lib/user-access";
import { familyOwnerIdFor, getFamilyAccessUser } from "@/lib/family-access";
import { getCropDisplayName } from "@/lib/crop-weather-context";
import { isPushConfigured, sendPushToUser } from "@/lib/push-server";
import {
  dateRangeIntersectsDay,
  formatReminderPayload,
  getDayBoundsInTimezone,
  getReminderRecipientsByOwnerIds,
  type ReminderEvent,
} from "@/lib/push-reminders";

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
  const ownerId = familyOwnerIdFor(user);
  const accessUser = await getFamilyAccessUser(user);

  const { id: plantId } = await params;
  const plant = await prisma.plant.findFirst({
    where: { id: plantId, userId: ownerId },
    select: { id: true },
  });
  if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

  if (hasFullAccess(accessUser)) {
    // ok
  } else if (isLegacyFreeTierUser(accessUser)) {
    const userCreatedCount = await prisma.plantTimelineEvent.count({
      where: {
        plant: { userId: ownerId },
        isUserCreated: true,
      },
    });
    if (userCreatedCount >= LEGACY_FREE_PLANNED_WORKS_LIMIT) {
      return NextResponse.json(
        {
          error:
            "Лимит бесплатной версии: не более 5 добавленных вручную работ. Оформите Премиум, чтобы добавлять любое количество.",
          code: "LIMIT_PLANNED_WORKS_FREE",
        },
        { status: 402 }
      );
    }
  } else {
    return NextResponse.json(
      {
        error:
          "Пробный период закончился. Оформите подписку Премиум, чтобы планировать работы на грядках.",
        code: "PAYMENT_REQUIRED",
      },
      { status: 402 }
    );
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
    include: {
      plant: {
        include: {
          bed: true,
        },
      },
    },
  });

  await sendManualWorkCreatedPush({
    ownerId,
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      scheduledDate: event.scheduledDate,
      dateTo: event.dateTo,
      isAction: event.isAction,
      isUserCreated: event.isUserCreated,
      plantName: event.plant.name,
      cropSlug: event.plant.cropSlug,
      bedName: event.plant.bed?.name ?? "Без грядки",
      bedType: event.plant.bed?.type ?? null,
    },
  }).catch((error) => {
    console.warn("Failed to send manual work push", error);
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

async function sendManualWorkCreatedPush({
  ownerId,
  event,
}: {
  ownerId: string;
  event: {
    id: string;
    title: string;
    description: string | null;
    scheduledDate: Date;
    dateTo: Date | null;
    isAction: boolean;
    isUserCreated: boolean;
    plantName: string;
    cropSlug: string | null;
    bedName: string;
    bedType: string | null;
  };
}) {
  if (!isPushConfigured() || !event.isAction) return;

  const tz = process.env.PUSH_REMINDERS_TZ ?? process.env.TZ ?? "Europe/Moscow";
  const today = getDayBoundsInTimezone(new Date(), tz);
  const tomorrowStartSeed = new Date(today.dayStart.getTime() + 24 * 60 * 60 * 1000);
  const tomorrow = getDayBoundsInTimezone(tomorrowStartSeed, tz);
  const isToday = dateRangeIntersectsDay({
    scheduledDate: event.scheduledDate,
    dateTo: event.dateTo,
    dayStart: today.dayStart,
    dayEnd: today.dayEnd,
  });
  const isTomorrow = dateRangeIntersectsDay({
    scheduledDate: event.scheduledDate,
    dateTo: event.dateTo,
    dayStart: tomorrow.dayStart,
    dayEnd: tomorrow.dayEnd,
  });

  if (!isToday && !isTomorrow) return;

  const recipients = (await getReminderRecipientsByOwnerIds([ownerId])).get(ownerId) ?? [];
  if (recipients.length === 0) return;

  const reminderEvent: ReminderEvent = {
    id: event.id,
    title: event.title,
    bedName: event.bedName,
    bedType: event.bedType,
    plantName: event.plantName,
    cropLabel: getCropDisplayName({
      name: event.plantName,
      cropSlug: event.cropSlug,
      bedType: event.bedType,
    }),
    description: event.description,
    isUserCreated: event.isUserCreated,
  };
  const payload = formatReminderPayload([reminderEvent], isToday);

  for (const recipient of recipients) {
    const dedupeKey = ["webpush-manual-work", recipient.id, event.id].join(":");
    try {
      await prisma.pushDeliveryLog.create({
        data: { userId: recipient.id, dedupeKey },
      });
    } catch (error) {
      if ((error as { code?: string } | null)?.code === "P2002") continue;
      throw error;
    }

    const { sent, subscriptions } = await sendPushToUser(recipient.id, payload);
    if (subscriptions === 0 || sent === 0) {
      await prisma.pushDeliveryLog.deleteMany({ where: { dedupeKey } });
    }
  }
}
