import { prisma } from "@/lib/prisma";

export type FamilyUser = {
  id: string;
  familyOwnerId?: string | null;
};

export function familyOwnerIdFor(user: FamilyUser): string {
  return user.familyOwnerId ?? user.id;
}

export function isFamilyOwner(user: FamilyUser): boolean {
  return !user.familyOwnerId;
}

export function assertOwnerCanDeletePlants(user: FamilyUser): boolean {
  return isFamilyOwner(user);
}

export async function getFamilyMembers(ownerId: string) {
  return prisma.user.findMany({
    where: { familyOwnerId: ownerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getFamilyAccessUser<T extends FamilyUser & { isPremium: boolean; createdAt: Date }>(
  user: T
): Promise<T | (FamilyUser & { isPremium: boolean; createdAt: Date })> {
  const ownerId = familyOwnerIdFor(user);
  if (ownerId === user.id) return user;
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: {
      id: true,
      familyOwnerId: true,
      isPremium: true,
      createdAt: true,
    },
  });
  return owner ?? user;
}
