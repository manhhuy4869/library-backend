import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class DeleteBooksDto {
  @ApiProperty({ type: [Number], minItems: 1, maxItems: 100 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];
}