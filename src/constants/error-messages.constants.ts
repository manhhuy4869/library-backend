// Message lỗi dùng chung - tránh mỗi service tự viết 1 câu khác nhau cho cùng 1 lỗi
export const ERROR_MESSAGES = {
  BOOK_NOT_FOUND: 'Không tìm thấy sách',
  READER_NOT_FOUND: 'Không tìm thấy độc giả',
  USER_NOT_FOUND: 'Không tìm thấy tài khoản',
  WRONG_OLD_PASSWORD: 'Mật khẩu cũ không đúng',
  BOOK_COPY_NOT_FOUND: 'Không tìm thấy bản sao sách',
  COPY_NOT_AVAILABLE: 'Bản sao sách này hiện không có sẵn để mượn',
  READER_BORROW_LIMIT: 'Độc giả đã mượn tối đa số sách cho phép',
  BORROW_RECORD_NOT_FOUND: 'Không tìm thấy phiếu mượn',
  ALREADY_RETURNED: 'Sách này đã được trả trước đó',
} as const;
