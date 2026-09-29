import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { IsUnique } from '../../../shared/database/constraints/unique.constraint';

export class CreateReaderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUnique('reader', 'studentCode') // báo lỗi validate ngay nếu mã SV đã tồn tại
  studentCode: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  className?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
