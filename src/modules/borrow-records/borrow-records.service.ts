import { BadRequestException, Injectable } from '@nestjs/common';
import { BorrowStatus, BookCopyStatus, FineStatus, FineType, ReceiptCondition } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { CopyNotAvailableException } from '../../common/exceptions/copy-not-available.exception';
import { BorrowLimitExceededException } from '../../common/exceptions/borrow-limit-exceeded.exception';
import { BorrowRecordNotFoundException } from '../../common/exceptions/borrow-record-not-found.exception';
import { AlreadyReturnedException } from '../../common/exceptions/already-returned.exception';
import { BORROW_DEFAULT_DAYS, BORROW_MAX_BOOKS_PER_READER, FINE_DAMAGED_BOOK, FINE_LOST_BOOK, FINE_PER_DAY } from '../../constants/business.constants';
import { buildPaginatedResult, getSkipTake } from '../../helper/paginate/paginate.helper';
import { BorrowBookDto } from './dto/borrow-book.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { SearchBorrowRecordDto } from './dto/search-borrow-record.dto';
import { ConfirmReceiptConditionDto, StudentReceiptCondition } from './dto/confirm-receipt-condition.dto';

const RECORD_INCLUDE = { copy: { include: { book: true } }, reader: true };
const OPEN_STATUSES = [BorrowStatus.borrowing, BorrowStatus.overdue];

@Injectable()
export class BorrowRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ readerId, status, search, activeOnly, page, pageSize }: SearchBorrowRecordDto) {
    const normalizedSearch = search?.trim();
    const where = {
      ...(readerId && { readerId }),
      ...(activeOnly ? { status: { in: OPEN_STATUSES } } : status && { status }),
      ...(normalizedSearch && {
        OR: [
          { reader: { is: { fullName: { contains: normalizedSearch, mode: 'insensitive' as const } } } },
          { reader: { is: { studentCode: { contains: normalizedSearch, mode: 'insensitive' as const } } } },
          { copy: { is: { copyCode: { contains: normalizedSearch, mode: 'insensitive' as const } } } },
          { copy: { is: { book: { is: { title: { contains: normalizedSearch, mode: 'insensitive' as const } } } } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.borrowRecord.findMany({
        where,
        include: RECORD_INCLUDE,
        orderBy: { borrowDate: 'desc' },
        ...getSkipTake(page, pageSize),
      }),
      this.prisma.borrowRecord.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: number) {
    const record = await this.prisma.borrowRecord.findUnique({ where: { id }, include: RECORD_INCLUDE });
    if (!record) throw new BorrowRecordNotFoundException();
    return record;
  }

  async findOwn(userId: number) {
    const reader = await this.prisma.reader.findUnique({ where: { userId }, select: { id: true } });
    if (!reader) throw new BadRequestException('Tài khoản chưa liên kết hồ sơ sinh viên');
    return this.prisma.borrowRecord.findMany({
      where: { readerId: reader.id, status: { in: OPEN_STATUSES } },
      include: RECORD_INCLUDE,
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOwnHistory(userId: number, { page, pageSize }: { page: number; pageSize: number }) {
    const reader = await this.prisma.reader.findUnique({ where: { userId }, select: { id: true } });
    if (!reader) throw new BadRequestException('Tài khoản chưa liên kết hồ sơ sinh viên');
    const where = { readerId: reader.id };
    const [items, total] = await Promise.all([
      this.prisma.borrowRecord.findMany({
        where,
        include: RECORD_INCLUDE,
        orderBy: { borrowDate: 'desc' },
        ...getSkipTake(page, pageSize),
      }),
      this.prisma.borrowRecord.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async confirmOwnCondition(userId: number, id: number, { condition, note }: ConfirmReceiptConditionDto) {
    return this.prisma.$transaction(async (tx) => {
      const reader = await tx.reader.findUnique({ where: { userId }, select: { id: true } });
      if (!reader) throw new BadRequestException('Tài khoản chưa liên kết hồ sơ sinh viên');
      const record = await tx.borrowRecord.findFirst({ where: { id, readerId: reader.id } });
      if (!record) throw new BorrowRecordNotFoundException();
      if (record.status === BorrowStatus.returned) throw new BadRequestException('Phiếu mượn đã đóng');
      if (record.receiptCondition !== ReceiptCondition.pending) {
        throw new BadRequestException('Tình trạng sách đã được xác nhận');
      }

      await tx.borrowRecord.update({
        where: { id },
        data: {
          receiptCondition: condition,
          conditionNote: condition === StudentReceiptCondition.DAMAGED ? note?.trim() || null : null,
          conditionConfirmedAt: new Date(),
        },
      });

      if (condition === StudentReceiptCondition.DAMAGED) {
        const staff = await tx.user.findMany({
          where: { role: { in: ['admin', 'librarian'] }, approvalStatus: 'approved' },
          select: { id: true },
        });
        if (staff.length) {
          await tx.notification.createMany({
            data: staff.map(({ id: staffId }) => ({
              userId: staffId,
              type: 'receipt_condition_reported',
              title: 'Sinh viên báo sách bị hỏng khi nhận',
              message: `Phiếu mượn #${record.id}${note?.trim() ? `: ${note.trim()}` : ''}`,
              referenceId: record.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.borrowRecord.findUniqueOrThrow({ where: { id }, include: RECORD_INCLUDE });
    });
  }

  // copyId/readerId đã được @EntityExists ở DTO chặn từ tầng validate - đảm bảo
  // cả 2 bản ghi tồn tại trước khi vào tới đây, không cần tự kiểm tra lại.
  async borrowBook({ copyId, readerId, issueConditionConfirmed }: BorrowBookDto) {
    if (!issueConditionConfirmed) throw new BadRequestException('Nhân viên phải xác nhận đã kiểm tra tình trạng sách trước khi giao');
    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra giới hạn mượn - đọc trước, rẻ, chặn sớm trước khi đụng ghi dữ liệu
      const activeCount = await tx.borrowRecord.count({
        where: { readerId, status: { in: OPEN_STATUSES } },
      });
      if (activeCount >= BORROW_MAX_BOOKS_PER_READER) {
        throw new BorrowLimitExceededException();
      }

      // 2. GUARD NGUYÊN TỬ: updateMany với điều kiện status = available ngay
      // trong WHERE - nếu 2 thủ thư cùng bấm mượn 1 bản sao cùng lúc, chỉ 1
      // request update được (count = 1), request còn lại update 0 dòng (count = 0)
      // vì lúc đó status đã đổi thành borrowed. Tương đương lockForUpdate() bên
      // Laravel nhưng không cần raw SQL - DB tự đảm bảo tính nguyên tử của UPDATE.
      const updated = await tx.bookCopy.updateMany({
        where: { id: copyId, status: BookCopyStatus.available },
        data: { status: BookCopyStatus.borrowed },
      });
      if (updated.count === 0) throw new CopyNotAvailableException();

      // 3. Tạo phiếu mượn
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + BORROW_DEFAULT_DAYS);

      return tx.borrowRecord.create({
        data: { copyId, readerId, dueDate, status: BorrowStatus.borrowing, staffIssueConfirmedAt: new Date() },
        include: RECORD_INCLUDE, // kèm vị trí kệ (copy.shelfRow/Column/Level) cho UI hiển thị
      });
    });
  }

  async returnBook({ copyId, condition, damageNote }: ReturnBookDto) {
    return this.prisma.$transaction(async (tx) => {
      const openRecord = await tx.borrowRecord.findFirst({
        where: { copyId, status: { in: OPEN_STATUSES } },
        orderBy: { borrowDate: 'desc' },
        include: { reader: true, copy: { include: { book: true } } },
      });

      if (!openRecord) {
        // Phân biệt rõ 2 trường hợp lỗi: đã trả rồi vs. bản sao này chưa từng
        // được mượn - giúp thủ thư hiểu đúng tình huống thay vì 1 lỗi chung chung
        const lastRecord = await tx.borrowRecord.findFirst({
          where: { copyId },
          orderBy: { borrowDate: 'desc' },
        });
        throw lastRecord ? new AlreadyReturnedException() : new BorrowRecordNotFoundException();
      }

      // GUARD NGUYÊN TỬ tương tự borrowBook(): where kèm status cũ - nếu 2 thủ
      // thư cùng xác nhận trả 1 lúc, chỉ 1 request update được, request sau
      // update 0 dòng và biết ngay là đã bị xử lý trước đó.
      const updated = await tx.borrowRecord.updateMany({
        where: { id: openRecord.id, status: openRecord.status },
        data: { returnDate: new Date(), status: BorrowStatus.returned },
      });
      if (updated.count === 0) throw new AlreadyReturnedException();

      await tx.bookCopy.update({
        where: { id: copyId },
        data: {
          status: condition,
          conditionNote: condition === BookCopyStatus.damaged ? damageNote?.trim() : null,
        },
      });

      if (condition === BookCopyStatus.damaged || condition === BookCopyStatus.lost) {
        const policy = await tx.finePolicy.upsert({
          where: { id: 1 },
          update: {},
          create: { id: 1, lateReturnPerDay: FINE_PER_DAY, damagedBookFee: FINE_DAMAGED_BOOK, lostBookFee: FINE_LOST_BOOK },
        });
        const type = condition === BookCopyStatus.damaged ? FineType.damaged : FineType.lost;
        const amount = condition === BookCopyStatus.damaged ? policy.damagedBookFee : policy.lostBookFee;
        const reason = condition === BookCopyStatus.damaged
          ? `Sách bị hỏng khi trả: ${damageNote?.trim()}`
          : 'Sách bị mất khi trả';
        const fine = await tx.fine.upsert({
          where: { borrowRecordId_type: { borrowRecordId: openRecord.id, type } },
          create: { borrowRecordId: openRecord.id, type, amount, daysLate: 0, reason, status: FineStatus.unpaid },
          update: { amount, reason },
        });
        if (openRecord.reader.userId) {
          const message = `Sách "${openRecord.copy.book.title}" bị ghi nhận ${type === FineType.damaged ? 'hỏng' : 'mất'} khi trả. Khoản phạt: ${amount.toLocaleString('vi-VN')}đ.`;
          await tx.notification.upsert({
            where: { userId_type_referenceId: { userId: openRecord.reader.userId, type: 'fine_assessed', referenceId: fine.id } },
            create: { userId: openRecord.reader.userId, type: 'fine_assessed', title: 'Phát sinh khoản phạt', message, referenceId: fine.id },
            update: { message, readAt: null },
          });
        }
      }

      // Trả về kèm vị trí kệ (copy.shelfRow/Column/Level) - đúng yêu cầu gốc:
      // thủ thư biết chính xác đặt sách về đâu, không phải nhớ hoặc đoán.
      return tx.borrowRecord.findUniqueOrThrow({ where: { id: openRecord.id }, include: RECORD_INCLUDE });
    });
  }
}
