import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class UpdateFinePolicyDto {
  @ApiProperty({ minimum: 0, maximum: 10000000 })
  @IsInt()
  @Min(0)
  @Max(10000000)
  lateReturnPerDay: number;

  @ApiProperty({ minimum: 0, maximum: 10000000 })
  @IsInt()
  @Min(0)
  @Max(10000000)
  damagedBookFee: number;

  @ApiProperty({ minimum: 0, maximum: 10000000 })
  @IsInt()
  @Min(0)
  @Max(10000000)
  lostBookFee: number;
}