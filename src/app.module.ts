import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { UserModule } from './modules/user/user.module';
import { BooksModule } from './modules/books/books.module';
import { BookCopiesModule } from './modules/book-copies/book-copies.module';
import { ReadersModule } from './modules/readers/readers.module';
import { BorrowRecordsModule } from './modules/borrow-records/borrow-records.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { RolesModule } from './modules/roles/roles.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { HealthModule } from './modules/health/health.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FinesModule } from './modules/fines/fines.module';
import { AuditModule } from './modules/audit/audit.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { appConfig, databaseConfig, jwtConfig, redisConfig, throttlerConfig, validationSchema } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, throttlerConfig],
      validationSchema,
      envFilePath: '.env',
    }),
    // forRootAsync vì cần đọc ttl/limit từ ConfigService thay vì hard-code
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { ttl: config.get<number>('throttler.ttl')!, limit: config.get<number>('throttler.limit')! },
      ],
    }),
    SharedModule, // Database + Redis + Logger, @Global() - import 1 lần duy nhất ở đây
    HealthModule,
    TasksModule,
    NotificationsModule,
    FinesModule,
    AuditModule,
    AuthModule,
    UserModule,
    BooksModule,
    BookCopiesModule,
    ReadersModule,
    BorrowRecordsModule,
    ReservationsModule,
    RolesModule,
    StatisticsModule,
  ],
  providers: [
    // Thứ tự CHẠY của guard toàn cục theo thứ tự khai báo: Throttler chặn spam
    // request TRƯỚC, JwtAuthGuard xác thực SAU - tránh tốn công decode JWT cho
    // request rõ ràng đang bị spam.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
