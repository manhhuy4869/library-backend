import { Logger } from '@nestjs/common';

// Bọc async function, tự log lỗi kèm ngữ cảnh (context) thay vì try/catch lặp lại
// ở từng service. Dùng: await catchError(() => this.prisma.book.create(...), 'BooksService')
export async function catchError<T>(fn: () => Promise<T>, context: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    new Logger(context).error(error instanceof Error ? error.message : error);
    throw error;
  }
}
