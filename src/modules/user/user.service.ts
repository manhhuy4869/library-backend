import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/database/prisma.service';
import { UserNotFoundException } from '../../common/exceptions/user-not-found.exception';
import { WrongPasswordException } from '../../common/exceptions/wrong-password.exception';
import { buildPaginatedResult, getSkipTake } from '../../helper/paginate/paginate.helper';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../constants/roles.enum';
import { RegisterStudentDto } from '../auth/dto/register-student.dto';

// Field KHÔNG BAO GIỜ trả ra ngoài - dù là response API hay log. select: { password:
// false } không tồn tại trong Prisma, nên phải tự loại bỏ thủ công sau khi query.
function excludePassword<T extends { password: string }>(user: T): Omit<T, 'password'> {
  const { password, ...rest } = user;
  return rest;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Dùng riêng cho AuthService.validateUser() - CẦN password để bcrypt.compare(),
  // không đi qua excludePassword() như các hàm public khác bên dưới.
  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findAll({ page, pageSize }: PaginationDto) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany(getSkipTake(page, pageSize)),
      this.prisma.user.count(),
    ]);
    return buildPaginatedResult(items.map(excludePassword), total, page, pageSize);
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UserNotFoundException();
    return excludePassword(user);
  }

  async create(dto: CreateUserDto) {
    if (dto.role) await this.ensureRoleExists(dto.role);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
    });
    return excludePassword(user);
  }

  async registerStudent(dto: RegisterStudentDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { username: dto.username, password: hashedPassword, fullName: dto.fullName, role: Role.STUDENT },
      });
      const reader = await tx.reader.findUnique({ where: { studentCode: dto.studentCode } });

      if (reader?.userId) throw new ConflictException('Mã sinh viên đã được liên kết với tài khoản khác');
      if (reader) {
        await tx.reader.update({ where: { id: reader.id }, data: { userId: user.id } });
      } else {
        await tx.reader.create({
          data: {
            fullName: dto.fullName,
            studentCode: dto.studentCode,
            className: dto.className,
            phone: dto.phone,
            userId: user.id,
          },
        });
      }

      return excludePassword(user);
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id); // báo lỗi sớm nếu không tồn tại
    if (dto.role) await this.ensureRoleExists(dto.role);
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    return excludePassword(user);
  }

  async remove(id: number) {
    await this.findOne(id);
    const user = await this.prisma.user.delete({ where: { id } });
    return excludePassword(user);
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UserNotFoundException();

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new WrongPasswordException();

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashedPassword } });
  }

  private async ensureRoleExists(code: string) {
    const role = await this.prisma.accessRole.findUnique({ where: { code }, select: { code: true } });
    if (!role) throw new BadRequestException(`Vai trò "${code}" không tồn tại`);
  }
}
