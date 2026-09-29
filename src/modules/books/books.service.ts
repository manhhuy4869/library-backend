import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { BookNotFoundException } from '../../common/exceptions/book-not-found.exception';
import { buildPaginatedResult, getSkipTake } from '../../helper/paginate/paginate.helper';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBookDto } from './dto/search-book.dto';
import { ImportBooksDto, ImportBookRowDto } from './dto/import-books.dto';

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll({ search, page, pageSize }: SearchBookDto) {
    // Chỉ cache trang 1 KHÔNG search - trường hợp phổ biến nhất (mở trang danh sách
    // lần đầu). Có search/phân trang khác thì bỏ qua cache, không đáng giữ nhiều key
    const cacheKey = 'books:page1';
    if (!search && page === 1) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return cached;
    }

    const where = search ? { title: { contains: search, mode: 'insensitive' as const } } : undefined;
    const [items, total] = await Promise.all([
      this.prisma.book.findMany({ where, include: { copies: true }, ...getSkipTake(page, pageSize) }),
      this.prisma.book.count({ where }),
    ]);

    const result = buildPaginatedResult(items, total, page, pageSize);
    // KHÔNG cache khi rỗng - nếu cache lúc DB chưa có dữ liệu (hoặc dữ liệu bị thêm
    // bằng cách khác ngoài API này, ví dụ seed/Prisma Studio), cache sẽ "kẹt" ở
    // trạng thái rỗng cho tới khi hết TTL (5 phút) dù DB đã có sách thật.
    if (!search && page === 1 && items.length > 0) await this.redis.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { copies: true },
    });
    if (!book) throw new BookNotFoundException();
    return book;
  }

  async create(dto: CreateBookDto) {
    const book = await this.prisma.book.create({ data: this.normalizeOptionalFields(dto) });
    await this.redis.del('books:page1'); // xóa cache cũ - danh sách vừa thay đổi
    return book;
  }

  async importMany({ rows }: ImportBooksDto) {
    const prepared = rows.map((row, index) => this.prepareBookImportRow(row, index));
    const totalCopies = prepared.reduce((total, row) => total + row.copyCodes.length, 0);
    if (totalCopies > 2000) throw new BadRequestException('Mỗi lần nhập tối đa 2.000 bản sao');

    const isbnValues = [...new Set(prepared.map(({ isbn }) => isbn).filter((isbn): isbn is string => !!isbn))];
    const existingBooks = await this.prisma.book.findMany({
      where: { isbn: { in: isbnValues } },
      select: { isbn: true },
    });
    const seenIsbns = new Set(existingBooks.map(({ isbn }) => isbn).filter((isbn): isbn is string => !!isbn));
    const rowsByUniqueBook = prepared.filter((row) => {
      if (!row.isbn) return true;
      if (seenIsbns.has(row.isbn)) return false;
      seenIsbns.add(row.isbn);
      return true;
    });

    const allCopyCodes = rowsByUniqueBook.flatMap(({ copyCodes }) => copyCodes);
    const existingCopies = await this.prisma.bookCopy.findMany({
      where: { copyCode: { in: allCopyCodes } },
      select: { copyCode: true },
    });
    const seenCopyCodes = new Set(existingCopies.map(({ copyCode }) => copyCode));
    const rowsToCreate = rowsByUniqueBook.filter((row) => {
      if (row.copyCodes.some((code) => seenCopyCodes.has(code))) return false;
      row.copyCodes.forEach((code) => seenCopyCodes.add(code));
      return true;
    });

    const result = await this.prisma.$transaction(async (tx) => {
      let createdBooks = 0;
      let createdCopies = 0;
      const copyData: { bookId: number; copyCode: string; shelfRow: string; shelfColumn: string; shelfLevel: string }[] = [];

      for (const row of rowsToCreate) {
        const book = await tx.book.create({
          data: { title: row.title, author: row.author, category: row.category, publisher: row.publisher, isbn: row.isbn },
        });
        createdBooks += 1;
        row.copyCodes.forEach((copyCode) => {
          copyData.push({
            bookId: book.id,
            copyCode,
            shelfRow: row.shelfRow,
            shelfColumn: row.shelfColumn,
            shelfLevel: row.shelfLevel,
          });
        });
      }

      if (copyData.length) {
        const copies = await tx.bookCopy.createMany({ data: copyData });
        createdCopies = copies.count;
      }
      return { created: createdBooks, copiesCreated: createdCopies, skipped: rows.length - createdBooks };
    });

    if (result.created) await this.redis.del('books:page1');
    return result;
  }

  async update(id: number, dto: UpdateBookDto) {
    await this.findOne(id); // báo lỗi sớm nếu không tồn tại
    const book = await this.prisma.book.update({
      where: { id },
      data: this.normalizeOptionalFields(dto),
    });
    await this.redis.del('books:page1');
    return book;
  }

  // Field optional (publisher, isbn) mà FE gửi chuỗi rỗng '' thay vì bỏ hẳn field
  // - chuyển thành undefined để Prisma không lưu '' vào cột có @unique (isbn),
  // tránh 2 sách cùng để trống isbn bị coi là "trùng" và ném lỗi P2002.
  private normalizeOptionalFields<T extends { publisher?: string; isbn?: string }>(dto: T) {
    return { ...dto, publisher: dto.publisher || undefined, isbn: dto.isbn || undefined };
  }

  private requiredText(value: unknown, field: string, rowIndex: number) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`Dòng ${rowIndex + 2}: thiếu ${field}`);
    }
    return value.trim();
  }

  private optionalText(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private prepareBookImportRow(row: ImportBookRowDto, index: number) {
    const quantity = row.copyQuantity ?? 0;
    const prefix = quantity ? this.requiredText(row.copyCodePrefix, 'copyCodePrefix', index) : undefined;
    const copyCodes = quantity === 1
      ? [prefix!]
      : Array.from({ length: quantity }, (_, copyIndex) => `${prefix}-${String(copyIndex + 1).padStart(3, '0')}`);

    return {
      title: this.requiredText(row.title, 'title', index),
      author: this.requiredText(row.author, 'author', index),
      category: this.requiredText(row.category, 'category', index),
      publisher: this.optionalText(row.publisher),
      isbn: this.optionalText(row.isbn),
      copyCodes,
      shelfRow: quantity ? this.requiredText(row.shelfRow, 'shelfRow', index) : '',
      shelfColumn: quantity ? this.requiredText(row.shelfColumn, 'shelfColumn', index) : '',
      shelfLevel: quantity ? this.requiredText(row.shelfLevel, 'shelfLevel', index) : '',
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    const book = await this.prisma.book.delete({ where: { id } });
    await this.redis.del('books:page1');
    return book;
  }
}
