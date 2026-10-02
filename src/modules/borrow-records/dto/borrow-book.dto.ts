import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt } from 'class-validator';
import { EntityExists } from '../../../shared/database/constraints/entity-exist.constraint';

export class BorrowBookDto {
  @ApiProperty()
  @IsInt()
  @EntityExists('bookCopy') // báo lỗi validate ngay nếu copyId không tồn tại
  copyId: number;

  @ApiProperty()
  @IsInt()
  @EntityExists('reader')
  readerId: number;

  @ApiProperty({ description: 'Nhân viên đã kiểm tra bản sao còn tốt trước khi giao' })
  @IsBoolean()
  issueConditionConfirmed: boolean;
}
