import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

export class CreateStudentAccountRowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateStudentsDto {
  @ApiProperty({ type: [CreateStudentAccountRowDto], maxItems: 500 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateStudentAccountRowDto)
  students: CreateStudentAccountRowDto[];
}