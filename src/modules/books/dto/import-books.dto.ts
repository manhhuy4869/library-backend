import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CreateBookDto } from './create-book.dto';

export class ImportBookRowDto extends CreateBookDto {
  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(500)
  copyQuantity?: number;

  @ApiPropertyOptional({ description: 'Required when copyQuantity is greater than 0' })
  @ValidateIf((row: ImportBookRowDto) => (row.copyQuantity ?? 0) > 0)
  @IsString()
  @IsNotEmpty()
  copyCodePrefix?: string;

  @ApiPropertyOptional()
  @ValidateIf((row: ImportBookRowDto) => (row.copyQuantity ?? 0) > 0)
  @IsString()
  @IsNotEmpty()
  shelfRow?: string;

  @ApiPropertyOptional()
  @ValidateIf((row: ImportBookRowDto) => (row.copyQuantity ?? 0) > 0)
  @IsString()
  @IsNotEmpty()
  shelfColumn?: string;

  @ApiPropertyOptional()
  @ValidateIf((row: ImportBookRowDto) => (row.copyQuantity ?? 0) > 0)
  @IsString()
  @IsNotEmpty()
  shelfLevel?: string;
}

export class ImportBooksDto {
  @ApiProperty({ type: [ImportBookRowDto], maxItems: 500 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportBookRowDto)
  rows: ImportBookRowDto[];
}