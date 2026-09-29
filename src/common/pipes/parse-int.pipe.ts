import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

// Nest có sẵn ParseIntPipe, nhưng viết lại 1 bản custom để chủ động thông báo lỗi
// bằng tiếng Việt - dùng: @Param('id', ParseIntCustomPipe) id: number
@Injectable()
export class ParseIntCustomPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException(`Tham số "${metadata.data}" phải là số nguyên`);
    }
    return val;
  }
}
