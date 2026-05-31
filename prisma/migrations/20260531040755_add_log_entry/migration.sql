-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('AUDIT', 'AUTH', 'ERROR');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "LogType" NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "method" TEXT,
    "path" TEXT,
    "statusCode" INTEGER,
    "resource" TEXT,
    "resourceId" TEXT,
    "durationMs" INTEGER,
    "ip" TEXT,
    "meta" JSONB,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogEntry_createdAt_idx" ON "LogEntry"("createdAt");

-- CreateIndex
CREATE INDEX "LogEntry_type_createdAt_idx" ON "LogEntry"("type", "createdAt");

-- CreateIndex
CREATE INDEX "LogEntry_userId_idx" ON "LogEntry"("userId");
