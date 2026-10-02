ALTER TABLE "borrow_records"
ADD COLUMN "staffIssueConfirmedAt" TIMESTAMP(3);

UPDATE "borrow_records"
SET "staffIssueConfirmedAt" = "borrowDate";

ALTER TABLE "book_copies"
ADD COLUMN "conditionNote" TEXT;