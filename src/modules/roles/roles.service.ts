import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Permission } from '../../constants/permissions.enum';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const ROLE_INCLUDE = { permissions: { include: { permission: true } } };

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.accessRole.findMany({ include: ROLE_INCLUDE, orderBy: { name: 'asc' } });
  }

  findPermissions() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateRoleDto) {
    await this.ensurePermissionsExist(dto.permissionCodes);
    return this.prisma.accessRole.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        permissions: {
          create: dto.permissionCodes.map((permissionCode) => ({ permission: { connect: { code: permissionCode } } })),
        },
      },
      include: ROLE_INCLUDE,
    });
  }

  async update(code: string, dto: UpdateRoleDto) {
    await this.ensureRoleExists(code);
    if (code === 'admin' && dto.permissionCodes && !dto.permissionCodes.includes(Permission.ROLE_MANAGE)) {
      throw new BadRequestException('Vai trò Admin bắt buộc phải giữ quyền quản lý vai trò');
    }
    if (dto.permissionCodes) await this.ensurePermissionsExist(dto.permissionCodes);

    await this.prisma.$transaction(async (tx) => {
      if (dto.permissionCodes) {
        await tx.rolePermission.deleteMany({ where: { roleCode: code } });
        if (dto.permissionCodes.length) {
          await tx.rolePermission.createMany({
            data: dto.permissionCodes.map((permissionCode) => ({ roleCode: code, permissionCode })),
          });
        }
      }
      await tx.accessRole.update({
        where: { code },
        data: { name: dto.name, description: dto.description },
      });
    });

    return this.prisma.accessRole.findUniqueOrThrow({ where: { code }, include: ROLE_INCLUDE });
  }

  async remove(code: string) {
    const role = await this.prisma.accessRole.findUnique({
      where: { code },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
    if (role.isSystem) throw new ForbiddenException('Không thể xóa vai trò hệ thống');
    if (role._count.users) throw new ConflictException('Không thể xóa vai trò đang được tài khoản sử dụng');
    return this.prisma.accessRole.delete({ where: { code } });
  }

  private async ensureRoleExists(code: string) {
    const role = await this.prisma.accessRole.findUnique({ where: { code }, select: { code: true } });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
  }

  private async ensurePermissionsExist(codes: string[]) {
    const count = await this.prisma.permission.count({ where: { code: { in: codes } } });
    if (count !== new Set(codes).size) {
      throw new BadRequestException('Danh sách có permission không tồn tại');
    }
  }
}