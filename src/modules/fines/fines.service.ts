import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FineStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class FinesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.fine.findMany({
      include: { borrowRecord: { include: { reader: true, copy: { include: { book: true } } } } },
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