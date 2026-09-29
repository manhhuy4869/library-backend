import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../constants/permissions.enum';
import { SearchBorrowersDto } from './dto/search-borrowers.dto';

@ApiTags('statistics')
@Controller('statistics')
@Permissions(Permission.BORROW_MANAGE)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  overview() {
    return this.statisticsService.overview();
  }

  @Get('borrowers')
  borrowers(@Query() query: SearchBorrowersDto) {
    return this.statisticsService.borrowers(query);
  }

  @Get('popular-books')
  popularBooks() { return this.statisticsService.popularBooks(); }

  @Get('monthly')
  monthly() { return this.statisticsService.monthly(); }
}
