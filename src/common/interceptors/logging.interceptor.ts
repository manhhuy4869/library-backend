import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Khác LoggerMiddleware ở chỗ: interceptor chạy SAU khi route đã xác định, nên biết
// được tên class + handler đang xử lý request - log có ngữ cảnh hơn middleware thô.
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Interceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => this.logger.debug(`${handler} - ${Date.now() - start}ms`)),
    );
  }
}
