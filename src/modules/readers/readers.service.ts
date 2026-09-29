import { BadRequestException, Injectable } from '@nestjs/common';
import { BorrowStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { ReaderNotFoundException } from '../../common/exceptions/reader-not-found.exception';
import { buildPaginatedResult, getSkipTake } from '../../helper/paginate/paginate.helper';
import { CreateReaderDto } from './dto/create-reader.dto';
import { UpdateReaderDto } from './dto/update-reader.dto';
import { SearchReaderDto } from './dto/search-reader.dto';
import { ImportReadersDto } from './dto/import-readers.dto';

@Injectable()
export class ReadersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ search, page, pageSize }: SearchReaderDto) {
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { studentCode: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      this.prisma.reader.findMany({ where, ...getSkipTake(page, pageSize) }),
      this.prisma.reader.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: number) {
    const reader = await this.prisma.reader.findUnique({
      where: { id },
      // Kèm luôn phiếu mượn đang mở - hữu ích cho borrow-records kiểm tra giới hạn
      // mượn và cho UI hiển thị "độc giả này đang mượn X cuốn"
      include: { borrowRecords: { where: { status: { in: [BorrowStatus.borrowing, BorrowStatus.overdue] } } } },
    });
    if (!reader) throw new ReaderNotFoundException();
    return reader;
  }

  create(dto: CreateReaderDto) {
    // @IsUnique('reader', 'studentCode') ở DTO đã chặn trùng mã SV từ tầng validate,
    // không cần tự kiểm tra lại ở đây
    return this.prisma.reader.create({ data: dto });
  }

  async importMany({ rows }: ImportReadersDto) {
    const data = rows.map((row, index) => ({
      fullName: this.requiredText(row.fullName, 'fullName', index),
      studentCode: this.requiredText(row.studentCode, 'studentCode', index),
      className: this.optionalText(row.className),
      phone: this.optionalText(row.phone),
    }));
    const result = await this.prisma.reader.createMany({ data, skipDuplicates: true });
    return { created: result.count, skipped: rows.length - result.count };
  }

  async update(id: number, dto: UpdateReaderDto) {
    await this.findOne(id); // báo lỗi sớm nếu không tồn tại
    return this.prisma.reader.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.reader.delete({ where: { id } });
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
}
