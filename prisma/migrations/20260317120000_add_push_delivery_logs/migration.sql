-- CreateTable
CREATE TABLE "push_delivery_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'webpush',
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_delivery_logs_dedupeKey_key" ON "push_delivery_logs"("dedupeKey");

-- CreateIndex
CREATE INDEX "push_delivery_logs_userId_createdAt_idx" ON "push_delivery_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "push_delivery_logs" ADD CONSTRAINT "push_delivery_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
