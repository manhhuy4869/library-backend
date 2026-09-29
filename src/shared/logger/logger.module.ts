import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { join } from 'path';

// Thay Logger mặc định của Nest bằng Pino - log ra JSON có cấu trúc (level, time,
// context, msg...) thay vì text thường, dễ đưa vào công cụ tra cứu log (ELK, Datadog)
// khi deploy thật. LoggerMiddleware ở common/ vẫn giữ nguyên, chỉ đổi nơi log ghi ra.
const isDev = process.env.NODE_ENV === 'development';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: isDev ? 'debug' : 'info',
        // Dev: in đẹp ra console (pino-pretty), dễ đọc lúc code.
        // KHÔNG PHẢI dev (staging/production/test): ghi JSON ra 2 nơi cùng lúc -
        // (1) stdout, để platform deploy (Docker/K8s/PM2...) vẫn thu log được như
        // bình thường, và (2) file logs/app.log trên đĩa, để có thể mở/grep trực
        // tiếp mà không phụ thuộc công cụ tra log ngoài. mkdir: true tự tạo thư
        // mục logs/ nếu chưa có, không cần tạo tay trước khi deploy.
        transport: isDev
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : {
              targets: [
                { target: 'pino/file', options: { destination: 1 } }, // fd 1 = stdout
                {
                  target: 'pino/file',
                  options: { destination: join(process.cwd(), 'logs', 'app.log'), mkdir: true },
                },
              ],
            },
        // genReqId: mỗi request có 1 ID duy nhất (ưu tiên header X-Request-Id nếu
        // client/proxy đã gắn sẵn, không thì tự sinh UUID). Mọi dòng log trong cùng
        // 1 request đều có chung requestId - lúc debug 1 lỗi cụ thể, filter theo
        // requestId ra hết toàn bộ log liên quan thay vì mò theo timestamp.
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'];
          const id = (existing as string) ?? randomUUID();
          res.setHeader('X-Request-Id', id); // trả lại cho client - hữu ích khi báo lỗi
          return id;
        },
      },
    }),
  ],
})
export class LoggerModule {}
