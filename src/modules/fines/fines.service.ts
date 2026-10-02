import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FineStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { UpdateFinePolicyDto } from './dto/update-fine-policy.dto';
import { FINE_DAMAGED_BOOK, FINE_LOST_BOOK, FINE_PER_DAY } from '../../constants/business.constants';

@Injectable()
export class FinesService {
  constructor(private readonly prisma: PrismaService) {}

  getPolicy() {
    return this.prisma.finePolicy.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, lateReturnPerDay: FINE_PER_DAY, damagedBookFee: FINE_DAMAGED_BOOK, lostBookFee: FINE_LOST_BOOK },
    });
  }

  async updatePolicy(userId: number, dto: UpdateFinePolicyDto) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.finePolicy.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, lateReturnPerDay: FINE_PER_DAY, damagedBookFee: FINE_DAMAGED_BOOK, lostBookFee: FINE_LOST_BOOK },
      });
      const after = await tx.finePolicy.update({ where: { id: 1 }, data: dto });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'update',
          entity: 'fine_policy',
          entityId: 1,
          metadata: {
            before: { lateReturnPerDay: before.lateReturnPerDay, damagedBookFee: before.damagedBookFee, lostBookFee: before.lostBookFee },
            after: {
              lateReturnPerDay: dto.lateReturnPerDay,
              damagedBookFee: dto.damagedBookFee,
              lostBookFee: dto.lostBookFee,
            },
          },
        },
      });
      return after;
    });
  }

  findPolicyHistory() {
    return this.prisma.auditLog.findMany({
      where: { entity: 'fine_policy' },
      include: { user: { select: { username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  findAll() {
    return this.prisma.fine.findMany({
      include: { borrowRecord: { include: { reader: true, copy: { include: { book: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOwn(userId: number) {
    const reader = await this.prisma.reader.findUnique({ where: { userId }, select: { id: true } });
    if (!reader) throw new BadRequestException('Tài khoản chưa liên kết hồ sơ sinh viên');
    return this.prisma.fine.findMany({
      where: { borrowRecord: { readerId: reader.id } },
      include: { borrowRecord: { include: { copy: { include: { book: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markPaid(id: number) {
    const fine = await this.prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new NotFoundException('Không tìm thấy khoản phạt');
    if (fine.status === FineStatus.paid) throw new ConflictException('Khoản phạt đã được thanh toán');
    return this.prisma.fine.update({ where: { id }, data: { status: FineStatus.paid, paidAt: new Date() } });
  }
}