-- ── Починка служебной таблицы Prisma (дубли / зависшие строки / applied_steps_count)
-- перед DDL телефонной авторизации. Идемпотентно.

UPDATE "_prisma_migrations"
SET "applied_steps_count" = COALESCE("applied_steps_count", 0);

ALTER TABLE "_prisma_migrations" ALTER COLUMN "applied_steps_count" DROP NOT NULL;
ALTER TABLE "_prisma_migrations" ALTER COLUMN "applied_steps_count" SET DEFAULT 0;

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

-- ── Телефонная авторизация (идемпотентно)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");

CREATE TABLE IF NOT EXISTS "phone_auth_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "firstSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sendCount" INTEGER NOT NULL DEFAULT 1,
    "verifyAttempts" INTEGER NOT NULL DEFAULT 0,
    "providerMessageId" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "phone_auth_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "phone_auth_codes_phone_key" ON "phone_auth_codes"("phone");
CREATE INDEX IF NOT EXISTS "phone_auth_codes_userId_idx" ON "phone_auth_codes"("userId");
CREATE INDEX IF NOT EXISTS "phone_auth_codes_expiresAt_idx" ON "phone_auth_codes"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'phone_auth_codes_userId_fkey'
  ) THEN
    ALTER TABLE "phone_auth_codes"
    ADD CONSTRAINT "phone_auth_codes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;
