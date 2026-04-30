-- AlterTable: add heroImage to Destination
ALTER TABLE "Destination" ADD COLUMN "heroImage" TEXT NOT NULL DEFAULT '';

-- Copy tour heroImage to destination (take first non-empty value per destination)
UPDATE "Destination" d
SET "heroImage" = (
  SELECT t."heroImage" FROM "Tour" t
  WHERE t."destinationId" = d.id AND t."heroImage" != ''
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM "Tour" t
  WHERE t."destinationId" = d.id AND t."heroImage" != ''
);

-- AlterTable: remove heroImage from Tour
ALTER TABLE "Tour" DROP COLUMN "heroImage";
