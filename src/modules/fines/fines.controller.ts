import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { FinesService } from './fines.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../types/jwt-payload.interface';
import { UpdateFinePolicyDto } from './dto/update-fine-policy.dto';

@ApiTags('fines')
@Controller('fines')
@Permissions(Permission.BORROW_MANAGE)
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Get('policy')
  @Permissions(Permission.BOOK_READ)
  getPolicy() { return this.finesService.getPolicy(); }

  @Put('policy')
  @Permissions(Permission.FINE_POLICY_MANAGE)
  updatePolicy(@CurrentUser() user: JwtPayload, @Body() dto: UpdateFinePolicyDto) {
    return this.finesService.updatePolicy(user.sub, dto);
  }

  @Get('policy/history')
  @Permissions(Permission.FINE_POLICY_MANAGE)
  findPolicyHistory() { return this.finesService.findPolicyHistory(); }

  @Get('own')
  @Permissions(Permission.BORROW_READ_OWN)
  findOwn(@CurrentUser() user: JwtPayload) { return this.finesService.findOwn(user.sub); }

  @Get()
  findAll() { return this.finesService.findAll(); }

  @Post(':id/pay')
  markPaid(@Param('id', ParseIntPipe) id: number) { return this.finesService.markPaid(id); }
}