-- 1. Create OrgRole
CREATE TABLE "OrgRole" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelVi" TEXT NOT NULL DEFAULT '',
    "labelEn" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgRole_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrgRole_key_key" ON "OrgRole"("key");

-- 2. Seed admin role so existing admin users can be backfilled.
INSERT INTO "OrgRole" ("id", "key", "labelVi", "labelEn", "order")
VALUES ('seed_admin_role_id', 'admin', 'Quản trị', 'Admin', 0);

-- 3. Add User.orgRoleId nullable
ALTER TABLE "User" ADD COLUMN "orgRoleId" TEXT;

-- 4. Backfill existing admin users
UPDATE "User" SET "orgRoleId" = 'seed_admin_role_id' WHERE "role" = 'ADMIN';

-- 5. Enforce NOT NULL + FK
ALTER TABLE "User" ALTER COLUMN "orgRoleId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_orgRoleId_fkey"
  FOREIGN KEY ("orgRoleId") REFERENCES "OrgRole"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Drop old Role enum column and type
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "Role";

-- 7. Relax auth-field nullability
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- 8. New team / profile columns
ALTER TABLE "User" ADD COLUMN "bioVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "bioEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "imageId" TEXT;
ALTER TABLE "User" ADD COLUMN "isCoreTeam" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "allowAuth" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "teamOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "User" ADD CONSTRAINT "User_imageId_fkey"
  FOREIGN KEY ("imageId") REFERENCES "CollectionImage"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_isCoreTeam_teamOrder_idx" ON "User"("isCoreTeam","teamOrder");
CREATE INDEX "User_orgRoleId_idx" ON "User"("orgRoleId");
