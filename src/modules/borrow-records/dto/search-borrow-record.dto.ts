import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { BorrowStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchBorrowRecordDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readerId?: number;

  @ApiPropertyOptional({ enum: BorrowStatus })
  @IsOptional()
  @IsEnum(BorrowStatus)
  status?: BorrowStatus;

  @ApiPropertyOptional({ description: 'Search book title, copy code, reader name, or student code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  activeOnly?: boolean;
}
