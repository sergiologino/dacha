import { prisma } from "@/lib/prisma";

/**
 * Доступ к фото: владелец записи; иначе владелец растения; иначе владелец грядки
 * этого растения; иначе владелец грядки, указанной у фото.
 * Нужно при рассинхроне userId (OAuth sub vs cuid) между photos/plants и beds.
 */
export async function userOwnsPhotoRow(
  userId: string,
  row: { userId: string; plantId: string | null; bedId: string | null }
): Promise<boolean> {
  if (row.userId === userId) return true;

  if (row.plantId) {
    const plant = await prisma.plant.findUnique({
      where: { id: row.plantId },
      select: { userId: true, bedId: true },
    });
    if (plant) {
      if (plant.userId === userId) return true;
      if (plant.bedId) {
        const bedOfPlant = await prisma.bed.findFirst({
          where: { id: plant.bedId, userId },
          select: { id: true },
        });
        if (bedOfPlant) return true;
      }
    }
  }

  if (row.bedId) {
    const b = await prisma.bed.findFirst({
      where: { id: row.bedId, userId },
      select: { id: true },
    });
    if (b) return true;
  }

  return false;
}
