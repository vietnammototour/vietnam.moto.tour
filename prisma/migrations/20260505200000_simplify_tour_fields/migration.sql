-- Remove rating column
ALTER TABLE "Tour" DROP COLUMN "rating";

-- Convert duration from string to integer (days)
ALTER TABLE "Tour" ADD COLUMN "duration_new" INTEGER NOT NULL DEFAULT 1;
UPDATE "Tour" SET "duration_new" = CASE
  WHEN "duration" ~ '^\d+' THEN CAST(SUBSTRING("duration" FROM '^\d+') AS INTEGER)
  ELSE 1
END;
ALTER TABLE "Tour" DROP COLUMN "duration";
ALTER TABLE "Tour" RENAME COLUMN "duration_new" TO "duration";

-- Convert distance from string to integer (km)
ALTER TABLE "Tour" ADD COLUMN "distance_new" INTEGER NOT NULL DEFAULT 0;
UPDATE "Tour" SET "distance_new" = CASE
  WHEN "distance" ~ '^\d+' THEN CAST(SUBSTRING("distance" FROM '^\d+') AS INTEGER)
  ELSE 0
END;
ALTER TABLE "Tour" DROP COLUMN "distance";
ALTER TABLE "Tour" RENAME COLUMN "distance_new" TO "distance";

-- Convert groupSize from string to integer
ALTER TABLE "Tour" ADD COLUMN "groupSize_new" INTEGER NOT NULL DEFAULT 2;
UPDATE "Tour" SET "groupSize_new" = CASE
  WHEN "groupSize" ~ '\d+' THEN CAST(SUBSTRING("groupSize" FROM '\d+') AS INTEGER)
  ELSE 2
END;
ALTER TABLE "Tour" DROP COLUMN "groupSize";
ALTER TABLE "Tour" RENAME COLUMN "groupSize_new" TO "groupSize";

-- Add 'days' translation key for tourDetail namespace
INSERT INTO "Translation" (id, namespace, key, "valueVi", "valueEn", "updatedAt")
VALUES (gen_random_uuid(), 'tourDetail', 'days', 'ngày', 'days', NOW())
ON CONFLICT (namespace, key) DO NOTHING;
