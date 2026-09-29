import { Module } from '@nestjs/common';
import { BookCopiesController } from './book-copies.controller';
import { BookCopiesService } from './book-copies.service';

@Module({
  controllers: [BookCopiesController],
  providers: [BookCopiesService],
  exports: [BookCopiesService],
})
export class BookCopiesModule {}
