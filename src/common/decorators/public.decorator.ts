import { SetMetadata } from '@nestjs/common';

// Dùng: @Public() trên route KHÔNG cần đăng nhập (login, refresh, health...).
// Cần thiết vì JwtAuthGuard sẽ đăng ký GLOBAL - mặc định MỌI route đều yêu cầu
// JWT hợp lệ trừ khi đánh dấu @Public() rõ ràng. An toàn hơn cách cũ (phải nhớ
// gắn @UseGuards() thủ công từng route - quên 1 chỗ là hở API).
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
