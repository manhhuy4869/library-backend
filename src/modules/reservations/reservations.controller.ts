import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { JwtPayload } from '../../types/jwt-payload.interface';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';
import { AuditService } from '../audit/audit.service';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService, private readonly audit: AuditService) {}

  @Get('own')
  @Permissions(Permission.RESERVATION_READ_OWN)
  findOwn(@CurrentUser() user: JwtPayload) {
    return this.reservationsService.findOwn(user.sub);
  }

  @Post()
  @Permissions(Permission.RESERVATION_CREATE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(user.sub, dto);
  }

  @Post(':id/cancel')
  @Permissions(Permission.RESERVATION_READ_OWN)
  async cancelOwn(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    const reservation = await this.reservationsService.cancelOwn(user.sub, id);
    await this.audit.record(user.sub, 'cancel', 'reservation', id);
    return reservation;
  }

  @Get()
  @Permissions(Permission.RESERVATION_MANAGE)
  findAll() {
    return this.reservationsService.findAll();
  }

  @Post(':id/fulfill')
  @Permissions(Permission.RESERVATION_MANAGE)
  async fulfill(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    const reservation = await this.reservationsService.fulfill(id);
    await this.audit.record(user.sub, 'fulfill', 'reservation', id);
    return reservation;
  }
}