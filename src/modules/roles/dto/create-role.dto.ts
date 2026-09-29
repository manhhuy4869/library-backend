import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ pattern: '^[a-z][a-z0-9_-]{1,31}$' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{1,31}$/)
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes: string[];
}