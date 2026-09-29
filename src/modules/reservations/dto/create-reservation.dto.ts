import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, Min } from 'class-validator';
import { EntityExists } from '../../../shared/database/constraints/entity-exist.constraint';

export class CreateReservationDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @EntityExists('bookCopy')
  copyId: number;

  @ApiProperty({ format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  scheduledAt: Date;
}