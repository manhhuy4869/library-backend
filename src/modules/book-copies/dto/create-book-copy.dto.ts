import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min, Max } from 'class-validator';
import { EntityExists } from '../../../shared/database/constraints/entity-exist.constraint';

export class CreateBookCopyDto {
  @ApiProperty()
  @IsInt()
  @EntityExists('book') // báo lỗi validate ngay nếu bookId không tồn tại
  bookId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  copyCode: string;

  @ApiProperty({ required: false, default: 1, minimum: 1, maximum: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  quantity?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shelfRow: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shelfColumn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shelfLevel: string;
}
