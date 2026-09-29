import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

// Query param dùng chung cho MỌI API danh sách (books, readers, borrow-records...) -
// extends DTO này thay vì viết lại page/pageSize ở từng nơi. @Type(() => Number)
// bắt buộc vì query string luôn là string, class-validator không tự ép kiểu.
export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 10;
}
