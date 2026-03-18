import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  phoneVerifiedAt: true,
  image: true,
  region: true,
  latitude: true,
  longitude: true,
  locationName: true,
  regionReport: true,
  onboardingDone: true,
  isPremium: true,
  premiumUntil: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const sessionEmail =
    typeof session.user.email === "string" && session.user.email.trim()
      ? session.user.email.trim().toLowerCase()
      : null;
  const sessionPhone =
    typeof session.user.phone === "string" && session.user.phone.trim()
      ? session.user.phone.trim()
      : null;
  const sessionId =
    typeof session.user.id === "string" && session.user.id.trim()
      ? session.user.id.trim()
      : null;

  const [userById, userByEmail, userByPhone] = await Promise.all([
    sessionId
      ? prisma.user.findUnique({
          where: { id: sessionId },
          select: authUserSelect,
        })
      : Promise.resolve(null),
    sessionEmail
      ? prisma.user.findUnique({
          where: { email: sessionEmail },
          select: authUserSelect,
        })
      : Promise.resolve(null),
    sessionPhone
      ? prisma.user.findUnique({
          where: { phone: sessionPhone },
          select: authUserSelect,
        })
      : Promise.resolve(null),
  ]);

  if (
    userById &&
    (!sessionEmail || userById.email === sessionEmail) &&
    (!sessionPhone || userById.phone === sessionPhone)
  ) {
    return userById;
  }

  if (userByEmail) {
    console.info("[auth][resolve-user][email]", {
      sessionId,
      sessionEmail,
      resolvedUserId: userByEmail.id,
    });
    return prisma.user.update({
      where: { id: userByEmail.id },
      data: {
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
      },
      select: authUserSelect,
    });
  }

  if (userByPhone) {
    console.info("[auth][resolve-user][phone]", {
      sessionId,
      sessionPhone,
      resolvedUserId: userByPhone.id,
    });
    return prisma.user.update({
      where: { id: userByPhone.id },
      data: {
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
        phoneVerifiedAt: new Date(),
      },
      select: authUserSelect,
    });
  }

  if (sessionEmail) {
    console.warn("[auth][resolve-user][create-email]", {
      sessionId,
      sessionEmail,
    });
    return prisma.user.create({
      data: {
        email: sessionEmail,
        name: session.user.name,
        image: session.user.image,
      },
      select: authUserSelect,
    });
  }

  if (sessionPhone) {
    console.warn("[auth][resolve-user][create-phone]", {
      sessionId,
      sessionPhone,
    });
    return prisma.user.create({
      data: {
        phone: sessionPhone,
        phoneVerifiedAt: new Date(),
        name: session.user.name,
        image: session.user.image,
      },
      select: authUserSelect,
    });
  }

  return null;
}
