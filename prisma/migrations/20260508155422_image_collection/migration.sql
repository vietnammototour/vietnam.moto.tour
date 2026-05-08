-- CreateTable
CREATE TABLE "ImageCollection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionImage" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "url" TEXT,
    "altEn" TEXT NOT NULL DEFAULT '',
    "altVi" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageCollection_key_key" ON "ImageCollection"("key");

-- CreateIndex
CREATE INDEX "CollectionImage_collectionId_order_idx" ON "CollectionImage"("collectionId", "order");

-- AddForeignKey
ALTER TABLE "CollectionImage" ADD CONSTRAINT "CollectionImage_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ImageCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
