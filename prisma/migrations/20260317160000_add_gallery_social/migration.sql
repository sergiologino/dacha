ALTER TABLE "photos"
ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE INDEX "photos_isPublic_publishedAt_idx" ON "photos"("isPublic", "publishedAt");

CREATE TABLE "photo_likes" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "photo_likes_photoId_userId_key" ON "photo_likes"("photoId", "userId");
CREATE INDEX "photo_likes_photoId_createdAt_idx" ON "photo_likes"("photoId", "createdAt");

ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "photo_comments" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "photo_comments_photoId_createdAt_idx" ON "photo_comments"("photoId", "createdAt");
CREATE INDEX "photo_comments_userId_createdAt_idx" ON "photo_comments"("userId", "createdAt");

ALTER TABLE "photo_comments" ADD CONSTRAINT "photo_comments_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "photo_comments" ADD CONSTRAINT "photo_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
