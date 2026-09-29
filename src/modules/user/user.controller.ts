import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../types/jwt-payload.interface';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';

// Không @Public() ở đâu trong controller này - JwtAuthGuard (global) tự áp dụng,
// mọi endpoint đều cần đăng nhập. TODO: khi có nhiều role, gắn thêm
// @Roles(Role.ADMIN) + RolesGuard cho các API quản lý tài khoản (create/update/remove),
// chỉ để lại changePassword mở cho chính người dùng tự đổi mật khẩu của mình.
@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions(Permission.USER_MANAGE)
  findAll(@Query() query: PaginationDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.USER_MANAGE)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Post()
  @Permissions(Permission.USER_MANAGE)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(':id')
  @Permissions(Permission.USER_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(+id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.USER_MANAGE)
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  // Tự đổi mật khẩu CỦA CHÍNH MÌNH - lấy id từ JWT (@CurrentUser), không nhận id
  // qua param, tránh 1 thủ thư đổi mật khẩu người khác nếu quên check quyền.
  @Post('me/change-password')
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user.sub, dto);
  }
}
