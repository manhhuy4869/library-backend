import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
@Permissions(Permission.ROLE_MANAGE)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  findPermissions() {
    return this.rolesService.findPermissions();
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Put(':code')
  update(@Param('code') code: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(code, dto);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.rolesService.remove(code);
  }
}