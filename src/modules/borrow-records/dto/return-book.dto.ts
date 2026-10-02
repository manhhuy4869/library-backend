import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';

export enum ReturnCondition {
  AVAILABLE = 'available',
  DAMAGED = 'damaged',
  LOST = 'lost',
}

export class ReturnBookDto {
  @ApiProperty()
  @IsInt()
  copyId: number;

  @ApiProperty({ enum: ReturnCondition })
  @IsEnum(ReturnCondition)
  condition: ReturnCondition;

  @ApiPropertyOptional({ maxLength: 500, description: 'Required when condition is damaged' })
  @ValidateIf((dto: ReturnBookDto) => dto.condition === ReturnCondition.DAMAGED)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  damageNote?: string;
}
