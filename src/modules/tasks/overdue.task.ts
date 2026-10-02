import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BorrowStatus, FineStatus, FineType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { FINE_DAMAGED_BOOK, FINE_LOST_BOOK, FINE_PER_DAY } from '../../constants/business.constants';

// Tương đương Laravel Task Scheduling (php artisan schedule:run + Kernel.php) -
// NestJS không có sẵn như Laravel, phải cài thêm @nestjs/schedule (nest-admin cũng
// làm y hệt vậy cho phần "định thời tác vụ").
@Injectable()
export class OverdueTask {
  private readonly logger = new Logger(OverdueTask.name);

  constructor(private readonly prisma: PrismaService) {}

  // Chạy 00:05 mỗi ngày - tìm phiếu mượn còn "borrowing" nhưng đã quá dueDate,
  // chuyển sang "overdue" để BE/FE hiển thị đúng, không phải tính lại mỗi lần query.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markOverdueBorrowRecords() {
    const result = await this.prisma.borrowRecord.updateMany({
      where: { status: BorrowStatus.borrowing, dueDate: { lt: new Date() } },
      data: { status: BorrowStatus.overdue },
    });

    if (result.count > 0) {
      this.logger.log(`Đã đánh dấu ${result.count} phiếu mượn quá hạn`);
    }

    const policy = await this.prisma.finePolicy.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, lateReturnPerDay: FINE_PER_DAY, damagedBookFee: FINE_DAMAGED_BOOK, lostBookFee: FINE_LOST_BOOK },
    });
    const finePerDay = policy.lateReturnPerDay;
    const overdueRecords = await this.prisma.borrowRecord.findMany({
      where: { status: BorrowStatus.overdue },
      include: { reader: true, copy: { include: { book: true } } },
    });
    for (const record of overdueRecords) {
      const daysLate = Math.max(1, Math.ceil((Date.now() - record.dueDate.getTime()) / 86_400_000));
      const amount = daysLate * finePerDay;
      await this.prisma.fine.upsert({
        where: { borrowRecordId_type: { borrowRecordId: record.id, type: FineType.late_return } },
        create: { borrowRecordId: record.id, type: FineType.late_return, daysLate, amount, status: FineStatus.unpaid },
        update: { daysLate, amount },
      });
      if (record.reader.userId) {
        await this.prisma.notification.upsert({
          where: { userId_type_referenceId: { userId: record.reader.userId, type: 'borrow_overdue', referenceId: record.id } },
          create: {
            userId: record.reader.userId,
            type: 'borrow_overdue',
            title: 'Sách đã quá hạn',
            message: `Sách "${record.copy.book.title}" đã quá hạn ${daysLate} ngày. Tiền phạt hiện tại: ${amount.toLocaleString('vi-VN')}đ.`,
            referenceId: record.id,
          },
          update: { message: `Sách "${record.copy.book.title}" đã quá hạn ${daysLate} ngày. Tiền phạt hiện tại: ${amount.toLocaleString('vi-VN')}đ.` },
        });
      }
    }
  }
}
