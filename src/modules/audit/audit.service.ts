import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(userId: number | undefined, action: string, entity: string, entityId?: number, metadata?: object) {
    return this.prisma.auditLog.create({ data: { userId, action, entity, entityId, metadata } });
  }

  findAll() {
    return this.prisma.auditLog.findMany({
      include: { user: { select: { username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}