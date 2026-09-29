import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { LoggerModule } from './logger/logger.module';

// Gom mọi hạ tầng dùng chung (DB, Redis, Log) vào 1 module duy nhất, import 1 lần
// ở app.module.ts - đúng pattern nest-admin. @Global() ở đây là thừa vì
// DatabaseModule/RedisModule đã tự @Global() rồi, nhưng gom lại giúp app.module.ts
// gọn: chỉ 1 dòng SharedModule thay vì 3 dòng import riêng lẻ.
@Global()
@Module({
  imports: [DatabaseModule, RedisModule, LoggerModule],
  exports: [DatabaseModule, RedisModule, LoggerModule],
})
export class SharedModule {}
