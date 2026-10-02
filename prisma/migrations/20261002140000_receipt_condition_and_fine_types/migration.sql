CREATE TYPE "ReceiptCondition" AS ENUM ('pending', 'good', 'damaged');
CREATE TYPE "FineType" AS ENUM ('late_return', 'damaged', 'lost');

ALTER TABLE "borrow_records"
ADD COLUMN "receiptCondition" "ReceiptCondition" NOT NULL DEFAULT 'pending',
ADD COLUMN "conditionNote" TEXT,
ADD COLUMN "conditionConfirmedAt" TIMESTAMP(3);

UPDATE "borrow_records"
SET "receiptCondition" = 'good', "conditionConfirmedAt" = COALESCE("returnDate", "borrowDate");

ALTER TABLE "fines"
ADD COLUMN "type" "FineType" NOT NULL DEFAULT 'late_return',
ADD COLUMN "reason" TEXT,
ALTER COLUMN "daysLate" SET DEFAULT 0;

DROP INDEX "fines_borrowRecordId_key";
CREATE UNIQUE INDEX "fines_borrowRecordId_type_key" ON "fines"("borrowRecordId", "type");