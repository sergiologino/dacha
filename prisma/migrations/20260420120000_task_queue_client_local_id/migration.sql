-- AlterTable
ALTER TABLE "task_queue" ADD COLUMN IF NOT EXISTS "clientLocalId" TEXT;

-- UniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "task_queue_userId_clientLocalId_key" ON "task_queue"("userId", "clientLocalId");
