import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, ValidationError, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './setup-swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationException } from './common/exceptions/validation.exception';
import './global/env';

// Gom lỗi class-validator (mảng ValidationError lồng nhau theo field) thành
// { tenField: ['lý do sai 1', 'lý do sai 2'] } - phẳng, dễ FE map vào form.
function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const err of errors) {
    if (err.constraints) result[err.property] = Object.values(err.constraints);
  }
  return result;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '1mb' });
  const config = app.get(ConfigService);

  // Deploy thật LUÔN đứng sau reverse proxy (Nginx, Cloudflare, ALB...) - thiếu
  // dòng này thì req.ip trả về IP của proxy thay vì IP thật của client, làm sai
  // lệch ThrottlerGuard (rate limit theo IP) và mọi log liên quan đến IP.
  app.set('trust proxy', 1);

  // Bắt buộc để @ValidatorConstraint (UniqueConstraint, EntityExistsConstraint...)
  // inject được service qua constructor - class-validator mặc định tự new() ra
  // instance, không đi qua DI container của Nest nên không inject được gì cả.
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useLogger(app.get(Logger)); // thay Logger mặc định bằng Pino (JSON có cấu trúc)

  // Helmet: set các HTTP header bảo mật chuẩn (X-Frame-Options, X-Content-Type-Options,
  // Strict-Transport-Security...) - thiếu là bị soi ngay ở security audit/pentest.
  app.use(helmet());
  // Nén response (gzip) - giảm băng thông đáng kể với JSON payload lớn (danh sách
  // sách/hóa đơn nhiều bản ghi), gần như miễn phí về hiệu năng CPU đổi lại.
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({ origin: config.get('app.frontendUrl'), credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => new ValidationException(formatValidationErrors(errors)),
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.setGlobalPrefix('api');
  // URI versioning: /api/v1/books thay vì /api/books - defaultVersion: '1' để
  // toàn bộ controller hiện có TỰ ĐỘNG lên v1 mà không cần sửa từng file. Route
  // mới có breaking change thì khai báo @Version('2') riêng trên controller/handler đó.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Graceful shutdown: khi deploy/restart (SIGTERM từ Docker/K8s), app hoàn tất
  // các request đang xử lý và đóng kết nối DB/Redis sạch sẽ thay vì cắt ngang
  // giữa chừng - tránh mất dữ liệu hoặc lỗi 502 cho người dùng đang thao tác.
  app.enableShutdownHooks();

  setupSwagger(app);

  const port = config.get<number>('app.port') ?? 3000;
  await app.listen(port);
  console.log(`Backend: http://localhost:${port}/api/v1`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
