import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../shared/database/prisma.service';
import { Permission } from '../../constants/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    const role = await this.prisma.accessRole.findUnique({
      where: { code: user?.role },
      select: { permissions: { select: { permission: { select: { code: true } } } } },
    });
    const granted = new Set(role?.permissions.map(({ permission }) => permission.code) ?? []);
    const allowed = required.every((permission) => granted.has(permission));
    if (!allowed) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    return true;
  }
}