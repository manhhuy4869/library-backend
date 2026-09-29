// Business code - KHÁC với HTTP status code. HTTP status vẫn đúng chuẩn REST
// (404, 400, 500...), nhưng "code" ở body giúp FE phân biệt lỗi cụ thể mà không
// phải parse chuỗi message (VD: FE so code === ERROR để biết chắc là lỗi, không
// cần biết message tiếng Việt viết gì).
export enum ResponseCode {
  SUCCESS = 0,
  ERROR = 1,
}
