-- Идемпотентно для прод-БД после частичных прогонов / рассинхрона истории

CREATE TABLE IF NOT EXISTS "guide_hack_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_hack_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "guide_hacks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_hacks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fact_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fun_facts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fun_facts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "guide_hack_categories_slug_key" ON "guide_hack_categories"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "guide_hacks_slug_key" ON "guide_hacks"("slug");

CREATE INDEX IF NOT EXISTS "guide_hacks_published_categoryId_idx" ON "guide_hacks"("published", "categoryId");

CREATE UNIQUE INDEX IF NOT EXISTS "fact_categories_slug_key" ON "fact_categories"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "fun_facts_slug_key" ON "fun_facts"("slug");

CREATE INDEX IF NOT EXISTS "fun_facts_published_categoryId_idx" ON "fun_facts"("published", "categoryId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guide_hacks_categoryId_fkey') THEN
    ALTER TABLE "guide_hacks" ADD CONSTRAINT "guide_hacks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "guide_hack_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fun_facts_categoryId_fkey') THEN
    ALTER TABLE "fun_facts" ADD CONSTRAINT "fun_facts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "fact_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
