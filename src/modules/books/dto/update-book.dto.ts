import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';

// PartialType làm toàn bộ field ở trên thành optional - đúng chuẩn PATCH/PUT một phần
export class UpdateBookDto extends PartialType(CreateBookDto) {}
