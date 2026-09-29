import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { FinesService } from './fines.service';

@ApiTags('fines')
@Controller('fines')
@Permissions(Permission.BORROW_MANAGE)
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Get()
  findAll() { return this.finesService.findAll(); }

  @Post(':id/pay')
  markPaid(@Param('id', ParseIntPipe) id: number) { return this.finesService.markPaid(id); }
}