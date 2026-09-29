import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BorrowRecordsService } from './borrow-records.service';
import { BorrowBookDto } from './dto/borrow-book.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { SearchBorrowRecordDto } from './dto/search-borrow-record.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../types/jwt-payload.interface';
import { AuditService } from '../audit/audit.service';

@ApiTags('borrow-records')
@Controller('borrow-records')
@Permissions(Permission.BORROW_MANAGE)
export class BorrowRecordsController {
  constructor(private readonly borrowRecordsService: BorrowRecordsService, private readonly audit: AuditService) {}

  @Get()
  findAll(@Query() query: SearchBorrowRecordDto) {
    return this.borrowRecordsService.findAll(query);
  }

  @Get('own')
  @Permissions(Permission.BORROW_READ_OWN)
  findOwn(@CurrentUser() user: JwtPayload) {
    return this.borrowRecordsService.findOwn(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.borrowRecordsService.findOne(+id);
  }

  @Post('borrow')
  async borrow(@CurrentUser() user: JwtPayload, @Body() dto: BorrowBookDto) {
    const record = await this.borrowRecordsService.borrowBook(dto);
    await this.audit.record(user.sub, 'borrow', 'borrow_record', record.id, { copyId: dto.copyId, readerId: dto.readerId });
    return record;
  }

  @Post('return')
  async return_(@CurrentUser() user: JwtPayload, @Body() dto: ReturnBookDto) {
    const record = await this.borrowRecordsService.returnBook(dto);
    await this.audit.record(user.sub, 'return', 'borrow_record', record.id, { copyId: dto.copyId });
    return record;
  }
}
