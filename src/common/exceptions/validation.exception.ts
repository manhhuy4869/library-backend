import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';
import { ErrorCode } from '../../constants/error-code.constant';

// errors: { tenField: ['lý do sai 1', 'lý do sai 2'] } - FE biết CHÍNH XÁC field
// nào sai, không phải parse chuỗi message gộp chung như mặc định của Nest.
export class ValidationException extends BusinessException {
  constructor(public readonly errors: Record<string, string[]>) {
    super('Dữ liệu không hợp lệ', ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST);
  }
}
