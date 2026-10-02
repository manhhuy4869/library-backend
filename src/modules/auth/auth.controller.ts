import { Controller, Post, Body, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterStudentDto } from './dto/register-student.dto';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

function refreshCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function clearRefreshCookieOptions(): CookieOptions {
  const options = refreshCookieOptions();
  delete options.maxAge;
  return options;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Siết chặt hơn mức mặc định toàn cục (100 request/phút) - login là điểm dễ bị
  // dò mật khẩu (brute-force) nhất trong cả hệ thống, cần giới hạn riêng
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // tối đa 5 lần thử/phút/IP
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken } = await this.authService.login(dto.username, dto.password);
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions());
    return { accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register-student')
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.authService.registerStudent(dto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];
    if (typeof refreshToken !== 'string') throw new UnauthorizedException('Thiếu refresh token');
    const tokens = await this.authService.refresh(refreshToken);
    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions());
    return { accessToken: tokens.accessToken };
  }

  // Không @Public() - JwtAuthGuard (global) tự áp dụng, cần đăng nhập mới logout được
  @Post('logout')
  async logout(@CurrentUser() user: { sub: number }, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(user.sub);
    response.clearCookie(REFRESH_TOKEN_COOKIE, clearRefreshCookieOptions());
  }
}
