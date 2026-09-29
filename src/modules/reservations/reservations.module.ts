import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService],
  imports: [AuditModule],
})
export class ReservationsModule {}