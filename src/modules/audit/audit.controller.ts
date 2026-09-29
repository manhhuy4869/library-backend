import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
@Permissions(Permission.ROLE_MANAGE)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll() { return this.auditService.findAll(); }
}