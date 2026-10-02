import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { join } from 'path';

// Console và file dùng cùng pretty format. File tự xoay mỗi ngày theo tên
// app-YYYY-MM-DD.log. LoggerMiddleware log request.
const isDev = process.env.NODE_ENV === 'development';
const logDirectory = join(process.cwd(), 'logs');
const prettyOptions = {
  colorize: isDev,
  translateTime: 'SYS:standard',
  levelFirst: true,
  singleLine: true,
  messageFormat: '{context}: {msg}',
  ignore: 'pid,hostname,context',
};

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: isDev ? 'debug' : 'info',
        autoLogging: false,
        // LoggerMiddleware đã ghi method/status/duration; tắt autoLogging để mỗi
        // request không bị ghi hai lần. Pino vẫn tạo request ID và gắn vào response.
        transport: isDev
          ? { target: 'pino-pretty', options: prettyOptions }
          : {
              targets: [
                {
                  target: 'pino-pretty',
                  options: prettyOptions,
                },
                {
                  target: join(__dirname, 'pretty-daily-transport.js'),
                  options: { logDirectory, prettyOptions },
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
