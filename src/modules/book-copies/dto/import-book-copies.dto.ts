import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt, IsObject, Min } from 'class-validator';
import { EntityExists } from '../../../shared/database/constraints/entity-exist.constraint';
import { CreateBookCopyDto } from './create-book-copy.dto';

export class ImportBookCopiesDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @EntityExists('book')
  bookId: number;

  @ApiProperty({ type: [CreateBookCopyDto], maxItems: 500 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsObject({ each: true })
  rows: Pick<CreateBookCopyDto, 'copyCode' | 'shelfRow' | 'shelfColumn' | 'shelfLevel'>[];
}