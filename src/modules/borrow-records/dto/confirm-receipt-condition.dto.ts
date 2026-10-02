import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum StudentReceiptCondition {
  GOOD = 'good',
  DAMAGED = 'damaged',
}

export class ConfirmReceiptConditionDto {
  @ApiProperty({ enum: StudentReceiptCondition })
  @IsEnum(StudentReceiptCondition)
  condition: StudentReceiptCondition;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}