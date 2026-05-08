ALTER TABLE "Highlight" ADD COLUMN "titleEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Highlight" ADD COLUMN "titleVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Highlight" ADD COLUMN "descriptionEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Highlight" ADD COLUMN "descriptionVi" TEXT NOT NULL DEFAULT '';

UPDATE "Highlight" SET "titleEn" = "textEn", "titleVi" = "textVi";

ALTER TABLE "Highlight" DROP COLUMN "textEn";
ALTER TABLE "Highlight" DROP COLUMN "textVi";
