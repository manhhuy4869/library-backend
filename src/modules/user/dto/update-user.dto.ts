import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

// Bỏ password (đổi mật khẩu dùng API riêng change-password) VÀ username (bỏ
// @IsUnique kế thừa - lý do giống UpdateBookCopyDto/UpdateReaderDto) khỏi
// PartialType(CreateUserDto), khai báo lại username KHÔNG có @IsUnique.
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'username'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;
}
