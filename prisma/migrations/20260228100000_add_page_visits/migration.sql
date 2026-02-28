-- CreateTable
CREATE TABLE "page_visits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "lastVisitedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_visits_userId_path_key" ON "page_visits"("userId", "path");

-- CreateIndex
CREATE INDEX "page_visits_path_idx" ON "page_visits"("path");

-- CreateIndex
CREATE INDEX "page_visits_userId_idx" ON "page_visits"("userId");

-- AddForeignKey
ALTER TABLE "page_visits" ADD CONSTRAINT "page_visits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
