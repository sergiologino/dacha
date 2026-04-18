-- CreateTable
CREATE TABLE "guide_hack_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_hack_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_hacks" (
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

-- CreateTable
CREATE TABLE "fact_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fun_facts" (
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

-- CreateIndex
CREATE UNIQUE INDEX "guide_hack_categories_slug_key" ON "guide_hack_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "guide_hacks_slug_key" ON "guide_hacks"("slug");

-- CreateIndex
CREATE INDEX "guide_hacks_published_categoryId_idx" ON "guide_hacks"("published", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "fact_categories_slug_key" ON "fact_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "fun_facts_slug_key" ON "fun_facts"("slug");

-- CreateIndex
CREATE INDEX "fun_facts_published_categoryId_idx" ON "fun_facts"("published", "categoryId");

-- AddForeignKey
ALTER TABLE "guide_hacks" ADD CONSTRAINT "guide_hacks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "guide_hack_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fun_facts" ADD CONSTRAINT "fun_facts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "fact_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
