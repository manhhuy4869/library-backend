import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// E2E test - dựng cả app thật (có DB), gọi HTTP thật vào /api/*. Chạy: npm run test:e2e
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // /health là route @Public() + VERSION_NEUTRAL - test smoke đơn giản nhất để xác
  // nhận app boot đúng, không cần JWT hay seed data. Test /books (cần JWT) nên viết
  // riêng kèm bước login lấy token trước.
  it('/api/health (GET) trả về 200', () => {
    return request(app.getHttpServer()).get('/api/health').expect(200);
  });
});
