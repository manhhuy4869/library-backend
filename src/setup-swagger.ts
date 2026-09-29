import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Tách riêng khỏi main.ts để bootstrap() gọn - nest-admin cũng tách file này
// tương tự, vì cấu hình Swagger dễ phình to (thêm tag, thêm mô tả...) theo thời gian.
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Library Management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
