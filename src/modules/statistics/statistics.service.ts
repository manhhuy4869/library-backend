import { Injectable } from '@nestjs/common';
import { BookCopyStatus, BorrowStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { buildPaginatedResult, getSkipTake } from '../../helper/paginate/paginate.helper';
import { SearchBorrowersDto } from './dto/search-borrowers.dto';

const OPEN_STATUSES = [BorrowStatus.borrowing, BorrowStatus.overdue];

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  // "Thống kê đơn giản" theo đúng yêu cầu đề tài - chỉ đếm, không xếp hạng/phân
  // tích phức tạp. Chạy song song bằng Promise.all vì các query độc lập nhau.
  async overview() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalBooks,
      totalCopies,
      availableCopies,
      borrowedCopies,
      lostOrDamagedCopies,
      totalReaders,
      readersWithBorrowHistory,
      readersCurrentlyBorrowing,
      currentlyBorrowing,
      overdue,
      borrowedThisMonth,
      returnedThisMonth,
    ] = await Promise.all([
      this.prisma.book.count(),
      this.prisma.bookCopy.count(),
      this.prisma.bookCopy.count({ where: { status: BookCopyStatus.available } }),
      this.prisma.bookCopy.count({ where: { status: BookCopyStatus.borrowed } }),
      this.prisma.bookCopy.count({
        where: { status: { in: [BookCopyStatus.lost, BookCopyStatus.damaged] } },
      }),
      this.prisma.reader.count(),
      this.prisma.reader.count({ where: { borrowRecords: { some: {} } } }),
      this.prisma.reader.count({ where: { borrowRecords: { some: { status: { in: OPEN_STATUSES } } } } }),
      this.prisma.borrowRecord.count({ where: { status: BorrowStatus.borrowing } }),
      this.prisma.borrowRecord.count({ where: { status: BorrowStatus.overdue } }),
      this.prisma.borrowRecord.count({ where: { borrowDate: { gte: startOfMonth } } }),
      this.prisma.borrowRecord.count({
        where: { status: BorrowStatus.returned, returnDate: { gte: startOfMonth } },
      }),
    ]);

    return {
      books: { total: totalBooks },
      copies: {
        total: totalCopies,
        available: availableCopies,
        borrowed: borrowedCopies,
        lostOrDamaged: lostOrDamagedCopies,
      },
      readers: {
        total: totalReaders,
        borrowed: readersWithBorrowHistory,
        currentlyBorrowing: readersCurrentlyBorrowing,
      },
      borrowing: {
        current: currentlyBorrowing,
        overdue,
        borrowedThisMonth,
        returnedThisMonth,
      },
    };
  }

  async borrowers({ page, pageSize, search }: SearchBorrowersDto) {
    const where = {
      borrowRecords: { some: { status: { in: OPEN_STATUSES } } },
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { studentCode: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.reader.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          studentCode: true,
          className: true,
          borrowRecords: { where: { status: { in: OPEN_STATUSES } }, select: { status: true } },
          _count: { select: { borrowRecords: true } },
        },
        orderBy: { fullName: 'asc' },
        ...getSkipTake(page, pageSize),
      }),
      this.prisma.reader.count({ where }),
    ]);

    const summaries = items.map(({ borrowRecords, _count, ...reader }) => ({
      ...reader,
      currentlyBorrowing: borrowRecords.length,
      overdue: borrowRecords.filter((record) => record.status === BorrowStatus.overdue).length,
      totalBorrowed: _count.borrowRecords,
    }));
    return buildPaginatedResult(summaries, total, page, pageSize);
  }

  popularBooks() {
    return this.prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        _count: { select: { copies: true } },
        copies: { select: { _count: { select: { borrowRecords: true } } } },
      },
      take: 10,
    }).then((books) => books.map(({ copies, ...book }) => ({
      ...book,
      borrowedCount: copies.reduce((sum, copy) => sum + copy._count.borrowRecords, 0),
    })).sort((a, b) => b.borrowedCount - a.borrowedCount));
  }

  async monthly() {
    const start = new Date();
    start.setMonth(start.getMonth() - 5, 1);
    start.setHours(0, 0, 0, 0);
    const records = await this.prisma.borrowRecord.findMany({
      where: { borrowDate: { gte: start } },
      select: { borrowDate: true, returnDate: true },
    });
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(start);
      date.setMonth(start.getMonth() + index);
      const month = date.getMonth();
      const year = date.getFullYear();
      return {
        month: `${year}-${String(month + 1).padStart(2, '0')}`,
        borrowed: records.filter((record) => record.borrowDate.getFullYear() === year && record.borrowDate.getMonth() === month).length,
        returned: records.filter((record) => record.returnDate?.getFullYear() === year && record.returnDate.getMonth() === month).length,
      };
    });
  }
}
