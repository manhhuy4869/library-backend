import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../../constants/error-code.constant';

// Exception gốc cho lỗi nghiệp vụ - mang theo errorCode CỤ THỂ (khác HTTP status
// chung chung) để HttpExceptionFilter đưa vào response, FE switch theo đó.
export class BusinessException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode: ErrorCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, status);
  }
}
