import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterStudentDto } from './dto/register-student.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Siết chặt hơn mức mặc định toàn cục (100 request/phút) - login là điểm dễ bị
  // dò mật khẩu (brute-force) nhất trong cả hệ thống, cần giới hạn riêng
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // tối đa 5 lần thử/phút/IP
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register-student')
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.authService.registerStudent(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // Không @Public() - JwtAuthGuard (global) tự áp dụng, cần đăng nhập mới logout được
  @Post('logout')
  logout(@CurrentUser() user: { sub: number }) {
    return this.authService.logout(user.sub);
  }
}
