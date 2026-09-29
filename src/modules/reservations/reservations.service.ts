import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BorrowStatus, BookCopyStatus, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { BORROW_DEFAULT_DAYS, BORROW_MAX_BOOKS_PER_READER } from '../../constants/business.constants';
import { CreateReservationDto } from './dto/create-reservation.dto';

const RESERVATION_INCLUDE = { copy: { include: { book: true } }, reader: true };
const OPEN_BORROW_STATUSES = [BorrowStatus.borrowing, BorrowStatus.overdue];

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, { copyId, scheduledAt }: CreateReservationDto) {
    if (scheduledAt <= new Date()) throw new BadRequestException('Thời gian nhận sách phải ở tương lai');

    return this.prisma.$transaction(async (tx) => {
      const reader = await tx.reader.findUnique({ where: { userId } });
      if (!reader) throw new BadRequestException('Tài khoản chưa liên kết hồ sơ sinh viên');

      const [activeBorrows, pendingReservations] = await Promise.all([
        tx.borrowRecord.count({ where: { readerId: reader.id, status: { in: OPEN_BORROW_STATUSES } } }),
        tx.reservation.count({ where: { readerId: reader.id, status: ReservationStatus.pending } }),
      ]);
      if (activeBorrows + pendingReservations >= BORROW_MAX_BOOKS_PER_READER) {
        throw new BadRequestException('Bạn đã đạt giới hạn số sách đang mượn/đặt trước');
      }

      const reserved = await tx.bookCopy.updateMany({
        where: { id: copyId, status: BookCopyStatus.available },
        data: { status: BookCopyStatus.reserved },
      });
      if (!reserved.count) throw new ConflictException('Bản sao này không còn sẵn để đặt trước');

      return tx.reservation.create({
        data: { copyId, readerId: reader.id, scheduledAt },
        include: RESERVATION_INCLUDE,
      });
    });
  }

  async findOwn(userId: number) {
    const reader = await this.prisma.reader.findUnique({ where: { userId } });
    if (!reader) throw new BadRequestException('Tài khoản chưa liên kết hồ sơ sinh viên');
    return this.prisma.reservation.findMany({
      where: { readerId: reader.id },
      include: RESERVATION_INCLUDE,
      orderBy: { scheduledAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.reservation.findMany({
      include: RESERVATION_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async cancelOwn(userId: number, id: number) {
    return this.prisma.$transaction(async (tx) => {
      const reader = await tx.reader.findUnique({ where: { userId } });
      if (!reader) throw new BadRequestException('Tài khoản chưa liên kết hồ sơ sinh viên');
      const reservation = await tx.reservation.findFirst({ where: { id, readerId: reader.id } });
      if (!reservation) throw new NotFoundException('Không tìm thấy lịch đặt');

      const updated = await tx.reservation.updateMany({
        where: { id, status: ReservationStatus.pending },
        data: { status: ReservationStatus.cancelled },
      });
      if (!updated.count) throw new ConflictException('Lịch đặt không còn ở trạng thái chờ');

      await tx.bookCopy.updateMany({
        where: { id: reservation.copyId, status: BookCopyStatus.reserved },
        data: { status: BookCopyStatus.available },
      });
      return tx.reservation.findUniqueOrThrow({ where: { id }, include: RESERVATION_INCLUDE });
    });
  }

  async fulfill(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id }, include: RESERVATION_INCLUDE });
      if (!reservation) throw new NotFoundException('Không tìm thấy lịch đặt');

      const activeCount = await tx.borrowRecord.count({
        where: { readerId: reservation.readerId, status: { in: OPEN_BORROW_STATUSES } },
      });
      if (activeCount >= BORROW_MAX_BOOKS_PER_READER) {
        throw new BadRequestException('Độc giả đã đạt giới hạn số sách đang mượn');
      }

      const updated = await tx.reservation.updateMany({
        where: { id, status: ReservationStatus.pending },
        data: { status: ReservationStatus.fulfilled },
      });
      if (!updated.count) throw new ConflictException('Lịch đặt không còn ở trạng thái chờ');

      const reserved = await tx.bookCopy.updateMany({
        where: { id: reservation.copyId, status: BookCopyStatus.reserved },
        data: { status: BookCopyStatus.borrowed },
      });
      if (!reserved.count) throw new ConflictException('Bản sao không còn được giữ cho lịch đặt này');

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + BORROW_DEFAULT_DAYS);
      await tx.borrowRecord.create({
        data: {
          copyId: reservation.copyId,
          readerId: reservation.readerId,
          dueDate,
          status: BorrowStatus.borrowing,
        },
      });
      return tx.reservation.findUniqueOrThrow({ where: { id }, include: RESERVATION_INCLUDE });
    });
  }
}