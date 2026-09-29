import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UniqueConstraint } from './constraints/unique.constraint';
import { EntityExistsConstraint } from './constraints/entity-exist.constraint';

// @Global() - PrismaService dùng ở mọi module không cần import lại. 2 constraint
// cũng phải khai báo là provider ở đây để useContainer() trong main.ts resolve
// được (class-validator gọi chúng ngoài luồng NestJS bình thường, cần DI container
// biết trước class nào tồn tại).
@Global()
@Module({
  providers: [PrismaService, UniqueConstraint, EntityExistsConstraint],
  exports: [PrismaService],
})
export class DatabaseModule {}
