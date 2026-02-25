-- AlterTable
ALTER TABLE "crops" ADD COLUMN IF NOT EXISTS "varieties" JSONB;
