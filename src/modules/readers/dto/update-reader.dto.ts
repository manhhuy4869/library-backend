import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateReaderDto } from './create-reader.dto';

// Bỏ studentCode khỏi PartialType(CreateReaderDto) rồi khai báo lại KHÔNG có
// @IsUnique - lý do giống UpdateBookCopyDto: giữ nguyên mã SV cũ khi chỉ sửa
// lớp/SĐT sẽ bị validator coi là "trùng với chính nó". DB @unique + P2002 handler
// vẫn bắt đúng khi thực sự đổi sang mã SV của người khác.
export class UpdateReaderDto extends PartialType(OmitType(CreateReaderDto, ['studentCode'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  studentCode?: string;
}
