-- Backfill localized columns from legacy ones where empty
UPDATE "Tour"
SET "titleVi" = "title"
WHERE "titleVi" = '' AND "title" <> '';

UPDATE "Tour"
SET "titleEn" = "title"
WHERE "titleEn" = '' AND "title" <> '';

UPDATE "Destination"
SET "nameVi" = "name"
WHERE "nameVi" = '' AND "name" <> '';

UPDATE "Destination"
SET "nameEn" = "name"
WHERE "nameEn" = '' AND "name" <> '';

-- Drop legacy unlocalized columns
ALTER TABLE "Tour" DROP COLUMN "title";
ALTER TABLE "Destination" DROP COLUMN "name";
