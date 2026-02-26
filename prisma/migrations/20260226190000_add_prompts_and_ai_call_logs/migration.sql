-- CreateTable
CREATE TABLE "prompts" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "endpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_call_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "messages" JSONB,
    "responsePreview" TEXT,
    "tokensInput" INTEGER,
    "tokensOutput" INTEGER,
    "tokensTotal" INTEGER,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "ai_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompts_key_key" ON "prompts"("key");

-- CreateIndex
CREATE INDEX "ai_call_logs_userId_createdAt_idx" ON "ai_call_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_call_logs_endpoint_createdAt_idx" ON "ai_call_logs"("endpoint", "createdAt");
