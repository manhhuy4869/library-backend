// Interface mô tả SHAPE dữ liệu nội bộ - khác DTO (DTO validate input từ client).
// Dùng khi trả danh sách có phân trang: books, readers, borrow-records...
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
