import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ResponseCode } from '../../constants/response-code.constant';
import { ErrorCode } from '../../constants/error-code.constant';
import { ApiResponse } from '../../types/api-response.interface';
import { ValidationException } from '../exceptions/validation.exception';

// @Catch() không tham số - bắt MỌI exception (kể cả lỗi hệ thống không phải
// HttpException, ví dụ lỗi Prisma) để không lỗi nào lọt ra ngoài dạng thô/crash
// mất kiểm soát. Response luôn khớp shape ApiResponse với TransformInterceptor.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Lỗi Prisma biết trước (trùng unique, không tìm thấy record để update/delete...)
    // KHÔNG phải lỗi hệ thống không lường trước - map thành response rõ nghĩa thay
    // vì rơi vào nhánh 500 chung chung "Đã có lỗi xảy ra ở hệ thống".
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, response);
    }

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttpException) {
      // Lỗi không lường trước - log đầy đủ để debug, không lộ chi tiết ra response
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    const body: ApiResponse = {
      code: ResponseCode.ERROR,
      errorCode: this.extractErrorCode(exception, isHttpException),
      message: isHttpException ? this.extractMessage(exception as HttpException) : 'Đã có lỗi xảy ra ở hệ thống',
      // ValidationException mang theo lỗi từng field - trả trong `data` để FE
      // highlight đúng field, thay vì chỉ có 1 message chung
      data: exception instanceof ValidationException ? exception.errors : null,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError, response: Response) {
    // Tham khảo: https://www.prisma.io/docs/orm/reference/error-reference
    let status = HttpStatus.BAD_REQUEST;
    let message = 'Dữ liệu không hợp lệ';

    switch (exception.code) {
      case 'P2002': {
        // Trùng giá trị ở field có @unique - target là mảng tên field vi phạm
        const target = (exception.meta?.target as string[] | undefined)?.join(', ') ?? 'dữ liệu';
        status = HttpStatus.CONFLICT;
        message = `Giá trị "${target}" đã tồn tại, vui lòng nhập giá trị khác`;
        break;
      }
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Không tìm thấy bản ghi để cập nhật/xóa';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Dữ liệu tham chiếu không hợp lệ (khóa ngoại)';
        break;
      default:
        // Mã lỗi Prisma khác chưa được liệt kê riêng - log đầy đủ để bổ sung
        // case cụ thể sau này, nhưng vẫn trả message rõ hơn "lỗi hệ thống"
        this.logger.error(`Lỗi Prisma chưa xử lý riêng: ${exception.code} - ${exception.message}`);
    }

    const body: ApiResponse = {
      code: ResponseCode.ERROR,
      errorCode: ErrorCode.HTTP_ERROR,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }

  private extractErrorCode(exception: unknown, isHttpException: boolean): ErrorCode {
    // Mọi exception tự định nghĩa (BusinessException, hoặc NotFoundException con
    // có gắn errorCode thủ công) đều mang theo errorCode riêng - ưu tiên dùng nó
    if (exception && typeof exception === 'object' && 'errorCode' in exception) {
      return (exception as { errorCode: ErrorCode }).errorCode;
    }
    if (!isHttpException) return ErrorCode.INTERNAL_ERROR;
    if (exception instanceof HttpException && exception.getStatus() === HttpStatus.UNAUTHORIZED) {
      return ErrorCode.UNAUTHORIZED;
    }
    return ErrorCode.HTTP_ERROR; // exception có sẵn của Nest, chưa gắn errorCode riêng
  }

  private extractMessage(exception: HttpException): string {
    const res = exception.getResponse();
    if (typeof res === 'string') return res;
    const msg = (res as { message?: string | string[] }).message;
    return Array.isArray(msg) ? msg.join(', ') : (msg ?? exception.message);
  }
}
