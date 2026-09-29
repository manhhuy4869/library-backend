CREATE TYPE "FineStatus" AS ENUM ('unpaid', 'paid');

CREATE TABLE "fines" (
  "id" SERIAL NOT NULL,
  "borrowRecordId" INTEGER NOT NULL,
  "amount" INTEGER NOT NULL,
  "daysLate" INTEGER NOT NULL,
  "status" "FineStatus" NOT NULL DEFAULT 'unpaid',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "fines_borrowRecordId_key" ON "fines"("borrowRecordId");
ALTER TABLE "fines" ADD CONSTRAINT "fines_borrowRecordId_fkey" FOREIGN KEY ("borrowRecordId") REFERENCES "borrow_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notifications" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "referenceId" INTEGER,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");
CREATE UNIQUE INDEX "notifications_userId_type_referenceId_key" ON "notifications"("userId", "type", "referenceId");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "audit_logs" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_entity_entityId_createdAt_idx" ON "audit_logs"("entity", "entityId", "createdAt");
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;