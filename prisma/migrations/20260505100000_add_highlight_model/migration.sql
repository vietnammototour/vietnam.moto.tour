-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textVi" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable (implicit many-to-many join table)
CREATE TABLE "_HighlightToTour" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HighlightToTour_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_HighlightToTour_B_index" ON "_HighlightToTour"("B");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightToTour" ADD CONSTRAINT "_HighlightToTour_A_fkey" FOREIGN KEY ("A") REFERENCES "Highlight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightToTour" ADD CONSTRAINT "_HighlightToTour_B_fkey" FOREIGN KEY ("B") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: convert existing JSON highlights to Highlight rows
DO $$
DECLARE
  tour_row RECORD;
  highlight_json JSONB;
  highlight_item JSONB;
  new_highlight_id TEXT;
BEGIN
  FOR tour_row IN SELECT id, "destinationId", highlights FROM "Tour" WHERE highlights IS NOT NULL AND highlights::text != '[]'
  LOOP
    highlight_json := tour_row.highlights::jsonb;
    FOR highlight_item IN SELECT * FROM jsonb_array_elements(highlight_json)
    LOOP
      new_highlight_id := gen_random_uuid()::text;
      INSERT INTO "Highlight" (id, "destinationId", "textEn", "textVi", "createdAt")
      VALUES (
        new_highlight_id,
        tour_row."destinationId",
        COALESCE(highlight_item->>'en', ''),
        COALESCE(highlight_item->>'vi', ''),
        NOW()
      );
      INSERT INTO "_HighlightToTour" ("A", "B")
      VALUES (new_highlight_id, tour_row.id);
    END LOOP;
  END LOOP;
END $$;

-- AlterTable
ALTER TABLE "Tour" DROP COLUMN "highlights";
