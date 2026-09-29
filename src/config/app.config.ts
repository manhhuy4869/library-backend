import { registerAs } from '@nestjs/config';

// registerAs tạo "namespace" - inject bằng ConfigService.get('app.port') thay vì
// process.env.PORT rải rác khắp nơi. Namespace theo tên file, dễ đoán khi project lớn dần.
export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
  nodeEnv: process.env.NODE_ENV ?? 'development',
}));
