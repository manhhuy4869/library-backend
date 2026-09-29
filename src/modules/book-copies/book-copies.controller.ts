import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookCopiesService } from './book-copies.service';
import { CreateBookCopyDto } from './dto/create-book-copy.dto';
import { UpdateBookCopyDto } from './dto/update-book-copy.dto';
import { SearchBookCopyDto } from './dto/search-book-copy.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { ImportBookCopiesDto } from './dto/import-book-copies.dto';

@ApiTags('book-copies')
@Controller('book-copies')
export class BookCopiesController {
  constructor(private readonly bookCopiesService: BookCopiesService) {}

  @Get()
  @Permissions(Permission.BOOK_READ)
  findAll(@Query() query: SearchBookCopyDto) {
    return this.bookCopiesService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.BOOK_READ)
  findOne(@Param('id') id: string) {
    return this.bookCopiesService.findOne(+id);
  }

  @Post()
  @Permissions(Permission.COPY_MANAGE)
  create(@Body() dto: CreateBookCopyDto) {
    return this.bookCopiesService.create(dto);
  }

  @Post('import')
  @Permissions(Permission.COPY_MANAGE)
  importMany(@Body() dto: ImportBookCopiesDto) {
    return this.bookCopiesService.importMany(dto);
  }

  @Put(':id')
  @Permissions(Permission.COPY_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateBookCopyDto) {
    return this.bookCopiesService.update(+id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.COPY_MANAGE)
  remove(@Param('id') id: string) {
    return this.bookCopiesService.remove(+id);
  }
}
