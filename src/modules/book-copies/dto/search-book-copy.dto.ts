import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BookCopyStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchBookCopyDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bookId?: number;

  @ApiPropertyOptional({ enum: BookCopyStatus })
  @IsOptional()
  @IsEnum(BookCopyStatus)
  status?: BookCopyStatus;
}
