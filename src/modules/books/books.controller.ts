import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBookDto } from './dto/search-book.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { ImportBooksDto } from './dto/import-books.dto';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @Permissions(Permission.BOOK_READ)
  findAll(@Query() query: SearchBookDto) {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.BOOK_READ)
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(+id);
  }

  @Post()
  @Permissions(Permission.BOOK_MANAGE)
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Post('import')
  @Permissions(Permission.BOOK_MANAGE)
  importMany(@Body() dto: ImportBooksDto) {
    return this.booksService.importMany(dto);
  }

  @Put(':id')
  @Permissions(Permission.BOOK_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(+id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.BOOK_MANAGE)
  remove(@Param('id') id: string) {
    return this.booksService.remove(+id);
  }
}
