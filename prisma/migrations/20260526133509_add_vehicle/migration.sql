-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SCOOTER', 'BIKE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "cc" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "priceUsdPerDay" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "description" JSONB NOT NULL DEFAULT '{"en":"","vi":""}',
    "status" "VehicleStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");

-- CreateIndex
CREATE INDEX "Vehicle_status_order_idx" ON "Vehicle"("status", "order");

-- CreateIndex
CREATE INDEX "Vehicle_type_idx" ON "Vehicle"("type");
