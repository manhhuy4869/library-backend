import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService], // export nếu module khác (borrow-records) cần gọi tới
})
export class BooksModule {}
