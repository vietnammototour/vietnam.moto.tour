-- CreateEnum
CREATE TYPE "TourStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'FEATURED');

-- Add new column with default
ALTER TABLE "Tour" ADD COLUMN "status" "TourStatus" NOT NULL DEFAULT 'DRAFT';

-- Migrate existing data
UPDATE "Tour" SET "status" = 'PUBLISHED' WHERE "isActive" = true;
UPDATE "Tour" SET "status" = 'ARCHIVED' WHERE "isActive" = false;

-- Drop old column
ALTER TABLE "Tour" DROP COLUMN "isActive";
