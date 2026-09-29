import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { IsUnique } from '../../../shared/database/constraints/unique.constraint';
import { Role } from '../../../constants/roles.enum';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUnique('user', 'username') // báo lỗi validate ngay nếu username đã tồn tại
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ default: Role.LIBRARIAN })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  role?: string;
}
