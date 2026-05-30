-- Add isFeatured flag to Tour
ALTER TABLE "Tour" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing FEATURED tours to PUBLISHED (isFeatured left false; admin re-marks)
UPDATE "Tour" SET "status" = 'PUBLISHED' WHERE "status" = 'FEATURED';

-- Recreate TourStatus enum without FEATURED
ALTER TYPE "TourStatus" RENAME TO "TourStatus_old";
CREATE TYPE "TourStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
ALTER TABLE "Tour" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tour" ALTER COLUMN "status" TYPE "TourStatus" USING ("status"::text::"TourStatus");
ALTER TABLE "Tour" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
DROP TYPE "TourStatus_old";

-- Index for featured lookups
CREATE INDEX "Tour_isFeatured_idx" ON "Tour"("isFeatured");
