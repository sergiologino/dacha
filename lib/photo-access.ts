import { prisma } from "@/lib/prisma";

/** Доступ к фото: владелец записи, владелец растения или грядки (устойчиво к рассинхрону userId в photos). */
export async function userOwnsPhotoRow(
  userId: string,
  row: { userId: string; plantId: string | null; bedId: string | null }
): Promise<boolean> {
  if (row.userId === userId) return true;
  if (row.plantId) {
    const p = await prisma.plant.findFirst({
      where: { id: row.plantId, userId },
      select: { id: true },
    });
    if (p) return true;
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
