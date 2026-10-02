import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RedisService } from '../../shared/redis/redis.service';
import { JwtPayload } from '../../types/jwt-payload.interface';
import { RegisterStudentDto } from './dto/register-student.dto';

// Theo pattern access token (sống ngắn) + refresh token (sống dài, lưu ở Redis):
// access token hết hạn -> FE gọi /auth/refresh bằng refresh token, không bắt đăng
// nhập lại. Refresh token lưu ở Redis (không phải DB) để dễ thu hồi (logout = xóa key).
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');

    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    await this.userService.ensureApproved(user.id);
    return this.issueTokens({ sub: user.id, username: user.username, role: user.role });
  }

  async registerStudent(dto: RegisterStudentDto) {
    await this.userService.registerStudent(dto);
    return { approvalStatus: 'pending', message: 'Đăng ký thành công. Tài khoản sẽ đăng nhập được sau khi quản trị viên duyệt.' };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: this.config.get('jwt.refreshSecret') });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // So với bản lưu ở Redis - nếu người dùng đã logout hoặc token bị thu hồi thì
    // giá trị trong Redis sẽ khác/đã bị xóa, chặn ngay dù chữ ký JWT vẫn hợp lệ.
    const stored = await this.redis.get<string>(`refresh:${payload.sub}`);
    if (stored !== refreshToken) throw new UnauthorizedException('Refresh token đã bị thu hồi');
    await this.userService.ensureApproved(payload.sub);

    return this.issueTokens(payload);
  }

  async logout(userId: number) {
    await this.redis.del(`refresh:${userId}`);
  }

  // private async issueTokens(payload: JwtPayload) {
  //   const accessToken = this.jwtService.sign(payload, {
  //     secret: this.config.get('jwt.secret'),
  //     expiresIn: this.config.get('jwt.expiresIn'),
  //   });
  //   const refreshToken = this.jwtService.sign(payload, {
  //     secret: this.config.get('jwt.refreshSecret'),
  //     expiresIn: this.config.get('jwt.refreshExpiresIn'),
  //   });

  //   // TTL Redis khớp thời hạn refresh token - tự dọn key khi hết hạn, không cần cron riêng
  //   await this.redis.set(`refresh:${payload.sub}`, refreshToken, 7 * 24 * 60 * 60);

  //   return { accessToken, refreshToken };
  // }

  private async issueTokens(payload: JwtPayload) {
    const tokenPayload: JwtPayload = {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
    });

    await this.redis.set(`refresh:${payload.sub}`, refreshToken, 7 * 24 * 60 * 60);

    return {
      accessToken,
      refreshToken,
    };
  }
}
