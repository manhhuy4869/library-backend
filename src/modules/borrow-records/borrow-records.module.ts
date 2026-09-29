import { Module } from '@nestjs/common';
import { BorrowRecordsController } from './borrow-records.controller';
import { BorrowRecordsService } from './borrow-records.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  controllers: [BorrowRecordsController],
  providers: [BorrowRecordsService],
  imports: [AuditModule],
})
export class BorrowRecordsModule {}
