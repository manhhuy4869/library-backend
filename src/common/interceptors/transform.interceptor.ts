import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseCode } from '../../constants/response-code.constant';
import { ApiResponse } from '../../types/api-response.interface';

// Chuẩn hóa MỌI response thành công thành cùng 1 shape ApiResponse - khớp với
// HttpExceptionFilter (chuẩn hóa response LỖI theo cùng shape đó). Đăng ký global
// trong main.ts, không cần khai báo lại ở từng controller.
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: ResponseCode.SUCCESS,
        message: 'success',
        data: data ?? null,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
