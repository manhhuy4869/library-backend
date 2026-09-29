// Mã lỗi CỤ THỂ cho từng loại exception - khác ResponseCode (chỉ có SUCCESS/ERROR
// chung chung). FE switch theo errorCode để xử lý riêng từng trường hợp (VD:
// COPY_NOT_AVAILABLE thì disable nút mượn, VALIDATION_FAILED thì highlight field lỗi)
// mà không phải so sánh chuỗi message (dễ vỡ khi đổi câu chữ tiếng Việt).
export enum ErrorCode {
  INTERNAL_ERROR = 1000,
  VALIDATION_FAILED = 1001,
  UNAUTHORIZED = 1002,
  HTTP_ERROR = 1003, // fallback cho exception có sẵn của Nest (BadRequest, Forbidden...) chưa gắn errorCode riêng

  BOOK_NOT_FOUND = 2001,
  READER_NOT_FOUND = 2002,
  COPY_NOT_AVAILABLE = 2003,
  BORROW_LIMIT_EXCEEDED = 2004,
  BORROW_RECORD_NOT_FOUND = 2005,
  ALREADY_RETURNED = 2006,
  USER_NOT_FOUND = 2007,
  WRONG_OLD_PASSWORD = 2008,
  BOOK_COPY_NOT_FOUND = 2009,
}
