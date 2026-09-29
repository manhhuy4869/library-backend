import { Test, TestingModule } from '@nestjs/testing';
import { ReadersService } from './readers.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { ReaderNotFoundException } from '../../common/exceptions/reader-not-found.exception';

describe('ReadersService', () => {
  let service: ReadersService;
  const mockPrisma = {
    reader: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ReadersService>(ReadersService);
    jest.clearAllMocks();
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  it('findOne() ném ReaderNotFoundException nếu không tìm thấy', async () => {
    mockPrisma.reader.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(ReaderNotFoundException);
  });

  it('findAll() trả về kết quả phân trang', async () => {
    mockPrisma.reader.findMany.mockResolvedValue([]);
    mockPrisma.reader.count.mockResolvedValue(0);
    const result = await service.findAll({ page: 1, pageSize: 10 });
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 10 });
  });
});
