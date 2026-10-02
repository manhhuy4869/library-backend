import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { StudentApprovalStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchUserDto extends PaginationDto {
  @ApiPropertyOptional({ enum: StudentApprovalStatus })
  @IsOptional()
  @IsEnum(StudentApprovalStatus)
  approvalStatus?: StudentApprovalStatus;
}