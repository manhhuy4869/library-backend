import { ResponseCode } from '../constants/response-code.constant';
import { ErrorCode } from '../constants/error-code.constant';

// Shape DUY NHẤT cho mọi response - cả thành công lẫn lỗi đều theo format này.
// errorCode chỉ có khi code = ERROR, giúp FE switch xử lý riêng từng loại lỗi
// thay vì so sánh chuỗi message.
export interface ApiResponse<T = unknown> {
  code: ResponseCode;
  errorCode?: ErrorCode;
  message: string;
  data: T | null;
  timestamp: string;
}
