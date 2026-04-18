#!/bin/sh
set -e
cd /app

# Prisma читает _prisma_migrations до выполнения SQL файлов. Битые NULL/дубли в этой
# таблице дают «Failed to extract applied_steps_count» — чиним через psql до migrate deploy.
repair_prisma_migrations_history() {
  [ -n "$DATABASE_URL" ] || return 0

  cnt="$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations';" 2>/dev/null | tr -d '[:space:]')"
  [ "$cnt" = "1" ] || return 0

  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
UPDATE "_prisma_migrations"
SET "applied_steps_count" = COALESCE("applied_steps_count", 0)
WHERE "applied_steps_count" IS NULL;

ALTER TABLE "_prisma_migrations"
  ALTER COLUMN "applied_steps_count" DROP NOT NULL,
  ALTER COLUMN "applied_steps_count" SET DEFAULT 0;

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
