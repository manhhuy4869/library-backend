ALTER TYPE "BookCopyStatus" ADD VALUE 'reserved';

CREATE TYPE "ReservationStatus" AS ENUM ('pending', 'fulfilled', 'cancelled');

ALTER TABLE "readers" ADD COLUMN "userId" INTEGER;
CREATE UNIQUE INDEX "readers_userId_key" ON "readers"("userId");
ALTER TABLE "readers" ADD CONSTRAINT "readers_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "copyId" INTEGER NOT NULL,
    "readerId" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reservations_readerId_scheduledAt_idx" ON "reservations"("readerId", "scheduledAt");
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_copyId_fkey"
  FOREIGN KEY ("copyId") REFERENCES "book_copies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_readerId_fkey"
  FOREIGN KEY ("readerId") REFERENCES "readers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;