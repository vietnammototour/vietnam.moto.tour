-- CreateEnum
CREATE TYPE "PerkCategory" AS ENUM ('TRANSPORT', 'FOOD', 'ACCOMMODATION', 'GUIDE', 'SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "PerkBucket" AS ENUM ('INCLUDED', 'EXCLUDED');

-- CreateTable
CREATE TABLE "Perk" (
    "id" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelVi" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "PerkCategory" NOT NULL DEFAULT 'OTHER',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPerk" (
    "tourId" TEXT NOT NULL,
    "perkId" TEXT NOT NULL,
    "bucket" "PerkBucket" NOT NULL,

    CONSTRAINT "TourPerk_pkey" PRIMARY KEY ("tourId","perkId")
);

-- CreateIndex
CREATE INDEX "TourPerk_perkId_idx" ON "TourPerk"("perkId");

-- AddForeignKey
ALTER TABLE "TourPerk" ADD CONSTRAINT "TourPerk_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPerk" ADD CONSTRAINT "TourPerk_perkId_fkey" FOREIGN KEY ("perkId") REFERENCES "Perk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
