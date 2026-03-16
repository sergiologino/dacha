import "server-only";

import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  formatRussianPhoneDisplay,
  maskRussianPhone,
  normalizeRussianPhone,
  sanitizeSmsCode,
} from "@/lib/phone";
import { sendSmsRuMessage } from "@/lib/sms-ru";

const CODE_TTL_MS = 10 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const SEND_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_VERIFY_ATTEMPTS = 5;

export class PhoneAuthError extends Error {
  status: number;
  retryAfterSec?: number;

  constructor(message: string, status = 400, retryAfterSec?: number) {
    super(message);
    this.name = "PhoneAuthError";
    this.status = status;
    this.retryAfterSec = retryAfterSec;
  }
}

function hashVerificationCode(phone: string, code: string): string {
  const secret = process.env.AUTH_SECRET || "dacha-ai";

  return createHash("sha256")
    .update(`${phone}:${code}:${secret}`)
    .digest("hex");
}

function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function sendPhoneVerificationCode(rawPhone: string) {
  const normalizedPhone = normalizeRussianPhone(rawPhone);

  if (!normalizedPhone) {
    throw new PhoneAuthError("Введите корректный номер телефона РФ в формате +7 (___) ___-__-__.");
  }

  const now = new Date();
  const existingCode = await prisma.phoneAuthCode.findUnique({
    where: { phone: normalizedPhone },
  });

  if (existingCode) {
    const cooldownEndsAt = existingCode.lastSentAt.getTime() + SEND_COOLDOWN_MS;
    if (cooldownEndsAt > now.getTime()) {
      const retryAfterSec = Math.ceil((cooldownEndsAt - now.getTime()) / 1000);
      throw new PhoneAuthError(
        "Код уже отправлен. Подождите немного перед повторной отправкой.",
        429,
        retryAfterSec,
      );
    }
  }

  const isWindowExpired =
    !existingCode || now.getTime() - existingCode.firstSentAt.getTime() > SEND_WINDOW_MS;
  const nextSendCount = isWindowExpired ? 1 : (existingCode?.sendCount ?? 0) + 1;

  if (!isWindowExpired && nextSendCount > MAX_SENDS_PER_WINDOW) {
    throw new PhoneAuthError("Слишком много запросов кода. Попробуйте позже.", 429);
  }

  const code = generateVerificationCode();
  const message = `Код входа в Любимая Дача: ${code}. Никому не сообщайте его.`;
  const smsResult = await sendSmsRuMessage({
    phone: normalizedPhone,
    message,
  });

  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  await prisma.phoneAuthCode.upsert({
    where: { phone: normalizedPhone },
    create: {
      phone: normalizedPhone,
      codeHash: hashVerificationCode(normalizedPhone, code),
      expiresAt,
      firstSentAt: now,
      lastSentAt: now,
      sendCount: 1,
      verifyAttempts: 0,
      providerMessageId: smsResult.providerMessageId,
      usedAt: null,
    },
    update: {
      codeHash: hashVerificationCode(normalizedPhone, code),
      expiresAt,
      firstSentAt: isWindowExpired ? now : existingCode?.firstSentAt ?? now,
      lastSentAt: now,
      sendCount: nextSendCount,
      verifyAttempts: 0,
      providerMessageId: smsResult.providerMessageId,
      usedAt: null,
    },
  });

  return {
    normalizedPhone,
    maskedPhone: maskRussianPhone(normalizedPhone),
    formattedPhone: formatRussianPhoneDisplay(normalizedPhone),
    expiresInSec: Math.floor(CODE_TTL_MS / 1000),
    retryAfterSec: Math.floor(SEND_COOLDOWN_MS / 1000),
  };
}

export async function authorizePhoneLogin(rawPhone: string, rawCode: string) {
  const normalizedPhone = normalizeRussianPhone(rawPhone);
  const code = sanitizeSmsCode(rawCode);

  if (!normalizedPhone || code.length !== 6) {
    return null;
  }

  const phoneAuthCode = await prisma.phoneAuthCode.findUnique({
    where: { phone: normalizedPhone },
  });

  if (!phoneAuthCode || phoneAuthCode.usedAt || phoneAuthCode.expiresAt <= new Date()) {
    return null;
  }

  if (phoneAuthCode.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    return null;
  }

  const expectedHash = hashVerificationCode(normalizedPhone, code);

  if (phoneAuthCode.codeHash !== expectedHash) {
    await prisma.phoneAuthCode.update({
      where: { phone: normalizedPhone },
      data: {
        verifyAttempts: {
          increment: 1,
        },
      },
    });
    return null;
  }

  const now = new Date();
  const user = await prisma.$transaction(async (tx) => {
    const dbUser = await tx.user.upsert({
      where: { phone: normalizedPhone },
      create: {
        phone: normalizedPhone,
        phoneVerifiedAt: now,
        name: formatRussianPhoneDisplay(normalizedPhone),
      },
      update: {
        phoneVerifiedAt: now,
      },
    });

    await tx.phoneAuthCode.update({
      where: { phone: normalizedPhone },
      data: {
        userId: dbUser.id,
        usedAt: now,
      },
    });

    return dbUser;
  });

  return {
    id: user.id,
    name: user.name ?? formatRussianPhoneDisplay(normalizedPhone),
    email: user.email ?? undefined,
    image: user.image ?? undefined,
    phone: user.phone,
  };
}
