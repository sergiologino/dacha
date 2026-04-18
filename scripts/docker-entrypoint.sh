#!/bin/sh
set -e
cd /app

# Prisma читает _prisma_migrations до SQL из prisma/migrations. Плюс Prisma вставляет
# строку миграции только с (id, checksum, started_at, migration_name) — без applied_steps_count;
# если колонка NOT NULL и без DEFAULT, INSERT падает (см. лог Postgres).
repair_prisma_migrations_history() {
  [ -n "$DATABASE_URL" ] || return 0

  cnt="$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations';" 2>/dev/null | tr -d '[:space:]')"
  [ "$cnt" = "1" ] || return 0

  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
ALTER TABLE "_prisma_migrations" ALTER COLUMN "applied_steps_count" SET DEFAULT 0;

UPDATE "_prisma_migrations"
SET "applied_steps_count" = COALESCE("applied_steps_count", 0);

ALTER TABLE "_prisma_migrations"
  ALTER COLUMN "applied_steps_count" DROP NOT NULL;

UPDATE "_prisma_migrations"
SET "applied_steps_count" = 0
WHERE "applied_steps_count" IS NULL;

DELETE FROM "_prisma_migrations"
WHERE ctid IN (
  SELECT ctid
  FROM (
    SELECT ctid,
           ROW_NUMBER() OVER (
             PARTITION BY migration_name
             ORDER BY finished_at DESC NULLS LAST, started_at DESC, id DESC
           ) AS rn
    FROM "_prisma_migrations"
  ) t
  WHERE rn > 1
);

UPDATE "_prisma_migrations"
SET "applied_steps_count" = COALESCE("applied_steps_count", 0)
WHERE "applied_steps_count" IS NULL;
SQL
}

repair_prisma_migrations_history

npx prisma migrate deploy
exec node server.js
