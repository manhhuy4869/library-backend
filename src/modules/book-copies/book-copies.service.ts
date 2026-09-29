import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { BookCopyStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { BookCopyNotFoundException } from '../../common/exceptions/book-copy-not-found.exception';
import { buildPaginatedResult, getSkipTake } from '../../helper/paginate/paginate.helper';
import { CreateBookCopyDto } from './dto/create-book-copy.dto';
import { UpdateBookCopyDto } from './dto/update-book-copy.dto';
import { SearchBookCopyDto } from './dto/search-book-copy.dto';
import { ImportBookCopiesDto } from './dto/import-book-copies.dto';

@Injectable()
export class BookCopiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ bookId, status, page, pageSize }: SearchBookCopyDto) {
    const where = { ...(bookId && { bookId }), ...(status && { status }) };

    const [items, total] = await Promise.all([
      this.prisma.bookCopy.findMany({ where, include: { book: true }, ...getSkipTake(page, pageSize) }),
      this.prisma.bookCopy.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  // Dùng khi borrow-records cần liệt kê bản sao CÒN MƯỢN ĐƯỢC của 1 đầu sách -
  // tách riêng hàm này (không đi qua findAll) vì không cần phân trang, chỉ cần
  // toàn bộ danh sách để hiển thị cho thủ thư chọn.
  findAvailableByBookId(bookId: number) {
    return this.prisma.bookCopy.findMany({ where: { bookId, status: BookCopyStatus.available } });
  }

  async findOne(id: number) {
    const copy = await this.prisma.bookCopy.findUnique({ where: { id }, include: { book: true } });
    if (!copy) throw new BookCopyNotFoundException();
    return copy;
  }

  async create({ quantity = 1, ...dto }: CreateBookCopyDto) {
    if (quantity === 1) return this.prisma.bookCopy.create({ data: dto });

    const copyCodes = Array.from(
      { length: quantity },
      (_, index) => `${dto.copyCode}-${String(index + 1).padStart(3, '0')}`,
    );
    const existing = await this.prisma.bookCopy.findMany({
      where: { copyCode: { in: copyCodes } },
      select: { copyCode: true },
    });
    if (existing.length) {
      throw new ConflictException(`Mã bản sao đã tồn tại: ${existing.map(({ copyCode }) => copyCode).join(', ')}`);
    }

    await this.prisma.bookCopy.createMany({ data: copyCodes.map((copyCode) => ({ ...dto, copyCode })) });
    return this.prisma.bookCopy.findMany({
      where: { copyCode: { in: copyCodes } },
      include: { book: true },
      orderBy: { id: 'asc' },
    });
  }

  async importMany({ bookId, rows }: ImportBookCopiesDto) {
    const data = rows.map((row, index) => ({
      bookId,
      copyCode: this.requiredText(row.copyCode, 'copyCode', index),
      shelfRow: this.requiredText(row.shelfRow, 'shelfRow', index),
      shelfColumn: this.requiredText(row.shelfColumn, 'shelfColumn', index),
      shelfLevel: this.requiredText(row.shelfLevel, 'shelfLevel', index),
    }));
    const result = await this.prisma.bookCopy.createMany({ data, skipDuplicates: true });
    return { created: result.count, skipped: rows.length - result.count };
  }

  async update(id: number, dto: UpdateBookCopyDto) {
    await this.findOne(id);
    return this.prisma.bookCopy.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.bookCopy.delete({ where: { id } });
  }

  private requiredText(value: unknown, field: string, rowIndex: number) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`Dòng ${rowIndex + 2}: thiếu ${field}`);
    }
    return value.trim();
  }
}
