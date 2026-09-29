import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { PrismaService } from '../../shared/database/prisma.service';

describe('StatisticsService', () => {
  let service: StatisticsService;
  const mockPrisma = {
    book: { count: jest.fn().mockResolvedValue(0) },
    bookCopy: { count: jest.fn().mockResolvedValue(0) },
    reader: { count: jest.fn().mockResolvedValue(0) },
    borrowRecord: { count: jest.fn().mockResolvedValue(0) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<StatisticsService>(StatisticsService);
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  it('overview() trả về đúng cấu trúc nhóm', async () => {
    const result = await service.overview();
    expect(result).toHaveProperty('books.total');
    expect(result).toHaveProperty('copies.available');
    expect(result).toHaveProperty('borrowing.overdue');
  });
});
