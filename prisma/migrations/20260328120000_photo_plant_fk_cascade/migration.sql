-- Фото больше не «отвязываются» от удалённого растения (SET NULL), а удаляются вместе с ним — превью и галерея не расходятся с БД.
ALTER TABLE "photos" DROP CONSTRAINT IF EXISTS "photos_plantId_fkey";
ALTER TABLE "photos" ADD CONSTRAINT "photos_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ранее отвязанные фото (plantId NULL) на грядке с единственным растением — вернуть связь, чтобы не терялись миниатюры и порядок.
UPDATE "photos" AS p
SET "plantId" = pl.id
FROM "plants" AS pl
WHERE p."plantId" IS NULL
  AND p."bedId" IS NOT NULL
  AND pl."bedId" = p."bedId"
  AND (SELECT COUNT(*)::int FROM "plants" AS p2 WHERE p2."bedId" = p."bedId") = 1;
