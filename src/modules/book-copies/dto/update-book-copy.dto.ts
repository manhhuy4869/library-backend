import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateBookCopyDto } from './create-book-copy.dto';

// Bỏ bookId (không cho đổi đầu sách gốc) VÀ copyCode (bỏ @IsUnique kế thừa từ
// CreateBookCopyDto - trên UPDATE, giữ nguyên copyCode cũ khi chỉ sửa vị trí kệ
// sẽ bị @IsUnique coi là "trùng với chính nó" và báo lỗi sai). Uniqueness khi
// THỰC SỰ đổi copyCode vẫn được đảm bảo bởi constraint @unique ở DB (Prisma) -
// HttpExceptionFilter đã xử lý P2002 thành thông báo rõ ràng nếu trùng thật.
export class UpdateBookCopyDto extends PartialType(
  OmitType(CreateBookCopyDto, ['bookId', 'copyCode', 'quantity'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  copyCode?: string;
}
