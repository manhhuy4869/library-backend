import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../types/jwt-payload.interface';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('own')
  findOwn(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.findOwn(user.sub);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markRead(user.sub, id);
  }
}