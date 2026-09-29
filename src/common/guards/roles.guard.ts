import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../constants/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Chạy SAU JwtAuthGuard (cần request.user có sẵn từ JWT) - đọc metadata gắn bởi
// @Roles(...) rồi so với role của user hiện tại. Dùng: @UseGuards(JwtAuthGuard, RolesGuard)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true; // handler không gắn @Roles -> ai đăng nhập cũng vào được

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
