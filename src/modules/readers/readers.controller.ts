import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReadersService } from './readers.service';
import { CreateReaderDto } from './dto/create-reader.dto';
import { UpdateReaderDto } from './dto/update-reader.dto';
import { SearchReaderDto } from './dto/search-reader.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { ImportReadersDto } from './dto/import-readers.dto';

@ApiTags('readers')
@Controller('readers')
@Permissions(Permission.READER_MANAGE)
export class ReadersController {
  constructor(private readonly readersService: ReadersService) {}

  @Get()
  findAll(@Query() query: SearchReaderDto) {
    return this.readersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.readersService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateReaderDto) {
    return this.readersService.create(dto);
  }

  @Post('import')
  importMany(@Body() dto: ImportReadersDto) {
    return this.readersService.importMany(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReaderDto) {
    return this.readersService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.readersService.remove(+id);
  }
}
