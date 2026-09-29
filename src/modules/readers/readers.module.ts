import { Module } from '@nestjs/common';
import { ReadersController } from './readers.controller';
import { ReadersService } from './readers.service';

@Module({
  controllers: [ReadersController],
  providers: [ReadersService],
  exports: [ReadersService],
})
export class ReadersModule {}
