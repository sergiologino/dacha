import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(
    "mailto:support@dacha-ai.ru",
    vapidPublic,
    vapidPrivate
  );
}

export function isPushConfigured(): boolean {
  return Boolean(vapidPublic && vapidPrivate);
}

export function getVapidPublicKey(): string | null {
  return vapidPublic ?? null;
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
};

type PushSubscriptionSendResult = "sent" | "stale";

export async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<PushSubscriptionSendResult> {
  if (!isPushConfigured()) return "stale";
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24,
      }
    );
    return "sent";
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) return "stale";
    throw err;
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; subscriptions: number; staleDeleted: number }> {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  });
  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];
  for (const sub of subs) {
    try {
      const result = await sendPushToSubscription(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      );
      if (result === "sent") {
        sent++;
      } else {
        failed++;
        staleIds.push(sub.id);
      }
    } catch {
      failed++;
    }
  }

  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: {
        id: { in: staleIds },
      },
    });
  }

  return {
    sent,
    failed,
    subscriptions: subs.length,
    staleDeleted: staleIds.length,
  };
}
