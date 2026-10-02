import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';

// Mẫu unit test - mock Prisma + Redis, không đụng DB/Redis thật. Copy pattern này
// sang readers.service.spec.ts, borrow-records.service.spec.ts khi viết xong nghiệp vụ.
describe('BooksService', () => {
  let service: BooksService;
  const mockPrisma = {
    book: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  };
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  it('findAll() gọi prisma.book.findMany khi cache trống', async () => {
    mockPrisma.book.findMany.mockResolvedValue([]);
    mockPrisma.book.count.mockResolvedValue(0);
    const result = await service.findAll({ page: 1, pageSize: 10 });
    expect(mockPrisma.book.findMany).toHaveBeenCalled();
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 10 });
    expect(mockRedis.set).toHaveBeenCalled();
  });

  it('findAll() lọc đồng thời theo tên sách, tác giả và thể loại', async () => {
    mockPrisma.book.findMany.mockResolvedValue([]);
    mockPrisma.book.count.mockResolvedValue(0);

    await service.findAll({ search: 'Lập trình', author: 'Nguyễn', category: 'Công nghệ', page: 1, pageSize: 10 });

    expect(mockPrisma.book.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        title: { contains: 'Lập trình', mode: 'insensitive' },
        author: { contains: 'Nguyễn', mode: 'insensitive' },
        category: { contains: 'Công nghệ', mode: 'insensitive' },
      },
    }));
  });
});
