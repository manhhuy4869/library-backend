import { SetMetadata } from '@nestjs/common';
import { Role } from '../../constants/roles.enum';

// Dùng: @Roles(Role.ADMIN) trên controller/handler cần giới hạn quyền
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
