ALTER TABLE "beds"
  ADD COLUMN "isVirtual" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "virtualKey" TEXT;

CREATE UNIQUE INDEX "beds_userId_virtualKey_key" ON "beds"("userId", "virtualKey");
