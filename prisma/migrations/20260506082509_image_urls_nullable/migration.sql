-- AlterTable
ALTER TABLE "Tour" ALTER COLUMN "imageUrl" DROP NOT NULL, ALTER COLUMN "imageUrl" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Destination" ALTER COLUMN "imageUrl" DROP NOT NULL, ALTER COLUMN "imageUrl" DROP DEFAULT, ALTER COLUMN "heroImage" DROP NOT NULL, ALTER COLUMN "heroImage" DROP DEFAULT;

-- Backfill empty strings to NULL
UPDATE "Tour" SET "imageUrl" = NULL WHERE "imageUrl" = '';
UPDATE "Destination" SET "imageUrl" = NULL WHERE "imageUrl" = '';
UPDATE "Destination" SET "heroImage" = NULL WHERE "heroImage" = '';
