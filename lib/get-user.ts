import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.id) {
    const userById = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (userById) {
      return userById;
    }
  }

  if (session.user.email) {
    return prisma.user.upsert({
      where: { email: session.user.email },
      update: { name: session.user.name ?? undefined, image: session.user.image ?? undefined },
      create: { email: session.user.email, name: session.user.name, image: session.user.image },
    });
  }

  if (session.user.phone) {
    return prisma.user.upsert({
      where: { phone: session.user.phone },
      update: {
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
        phoneVerifiedAt: new Date(),
      },
      create: {
        phone: session.user.phone,
        phoneVerifiedAt: new Date(),
        name: session.user.name,
        image: session.user.image,
      },
    });
  }

  return null;
}
