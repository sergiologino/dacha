-- CreateTable
CREATE TABLE "plant_timeline_events" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3),
    "isAction" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plant_timeline_events_plantId_idx" ON "plant_timeline_events"("plantId");

-- AddForeignKey
ALTER TABLE "plant_timeline_events" ADD CONSTRAINT "plant_timeline_events_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
