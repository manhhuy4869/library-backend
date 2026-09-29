import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Middleware khác Interceptor/Guard ở chỗ: chạy TRƯỚC khi vào routing, không biết
// route nào sẽ xử lý request - phù hợp cho việc log thô, không phù hợp cho logic
// nghiệp vụ (đó là việc của Guard/Interceptor/Service).
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const ms = Date.now() - start;
      this.logger.log(`${method} ${originalUrl} ${statusCode} - ${ms}ms`);
    });

    next();
  }
}
