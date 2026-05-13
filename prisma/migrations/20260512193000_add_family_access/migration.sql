ALTER TABLE "users"
  ADD COLUMN "familyOwnerId" TEXT,
  ADD COLUMN "familyInviteToken" TEXT,
  ADD COLUMN "familyInviteExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_familyInviteToken_key" ON "users"("familyInviteToken");
CREATE INDEX "users_familyOwnerId_idx" ON "users"("familyOwnerId");

ALTER TABLE "users"
  ADD CONSTRAINT "users_familyOwnerId_fkey"
  FOREIGN KEY ("familyOwnerId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
