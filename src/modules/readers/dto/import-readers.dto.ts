import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsObject } from 'class-validator';
import { CreateReaderDto } from './create-reader.dto';

export class ImportReadersDto {
  @ApiProperty({ type: [CreateReaderDto], maxItems: 500 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsObject({ each: true })
  rows: CreateReaderDto[];
}