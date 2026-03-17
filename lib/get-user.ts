import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;

  const sessionEmail =
    typeof session.user.email === "string" && session.user.email.trim()
      ? session.user.email.trim()
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
        })
      : Promise.resolve(null),
    sessionEmail
      ? prisma.user.findUnique({
          where: { email: sessionEmail },
        })
      : Promise.resolve(null),
    sessionPhone
      ? prisma.user.findUnique({
          where: { phone: sessionPhone },
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
    return prisma.user.update({
      where: { id: userByEmail.id },
      data: {
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
      },
    });
  }

  if (userByPhone) {
    return prisma.user.update({
      where: { id: userByPhone.id },
      data: {
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
        phoneVerifiedAt: new Date(),
      },
    });
  }

  if (sessionEmail) {
    return prisma.user.create({
      data: {
        email: sessionEmail,
        name: session.user.name,
        image: session.user.image,
      },
    });
  }

  if (sessionPhone) {
    return prisma.user.create({
      data: {
        phone: sessionPhone,
        phoneVerifiedAt: new Date(),
        name: session.user.name,
        image: session.user.image,
      },
    });
  }

  return null;
}
