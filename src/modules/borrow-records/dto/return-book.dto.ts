import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class ReturnBookDto {
  @ApiProperty()
  @IsInt()
  copyId: number;
}
