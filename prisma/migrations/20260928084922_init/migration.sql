-- CreateEnum
CREATE TYPE "BookCopyStatus" AS ENUM ('available', 'borrowed', 'lost', 'damaged');

-- CreateEnum
CREATE TYPE "BorrowStatus" AS ENUM ('borrowing', 'returned', 'overdue');

-- CreateTable
CREATE TABLE "books" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publisher" TEXT,
    "isbn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_copies" (
    "id" SERIAL NOT NULL,
    "bookId" INTEGER NOT NULL,
    "copyCode" TEXT NOT NULL,
    "shelfRow" TEXT NOT NULL,
    "shelfColumn" TEXT NOT NULL,
    "shelfLevel" TEXT NOT NULL,
    "status" "BookCopyStatus" NOT NULL DEFAULT 'available',

    CONSTRAINT "book_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readers" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "className" TEXT,
    "phone" TEXT,

    CONSTRAINT "readers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrow_records" (
    "id" SERIAL NOT NULL,
    "copyId" INTEGER NOT NULL,
    "readerId" INTEGER NOT NULL,
    "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "status" "BorrowStatus" NOT NULL DEFAULT 'borrowing',

    CONSTRAINT "borrow_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'librarian',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "book_copies_copyCode_key" ON "book_copies"("copyCode");

-- CreateIndex
CREATE UNIQUE INDEX "readers_studentCode_key" ON "readers"("studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_records" ADD CONSTRAINT "borrow_records_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "book_copies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_records" ADD CONSTRAINT "borrow_records_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "readers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
