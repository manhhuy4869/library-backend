import { PaginatedResult } from '../../types/paginated-result.interface';

// Hàm dùng chung cho MỌI danh sách cần phân trang (books, readers, borrow-records...)
// - tránh mỗi service tự viết lại công thức skip/take + đếm total.
export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return { items, total, page, pageSize };
}

export function getSkipTake(page = 1, pageSize = 10) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
