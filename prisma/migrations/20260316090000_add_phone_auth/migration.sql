ALTER TABLE "users"
ADD COLUMN "phone" TEXT,
ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

CREATE TABLE "phone_auth_codes" (
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

CREATE UNIQUE INDEX "phone_auth_codes_phone_key" ON "phone_auth_codes"("phone");
CREATE INDEX "phone_auth_codes_userId_idx" ON "phone_auth_codes"("userId");
CREATE INDEX "phone_auth_codes_expiresAt_idx" ON "phone_auth_codes"("expiresAt");

ALTER TABLE "phone_auth_codes"
ADD CONSTRAINT "phone_auth_codes_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
