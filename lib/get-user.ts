import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: { name: session.user.name ?? undefined, image: session.user.image ?? undefined },
    create: { email: session.user.email, name: session.user.name, image: session.user.image },
  });

  return user;
}
