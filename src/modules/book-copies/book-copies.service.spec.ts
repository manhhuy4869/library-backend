import { Test, TestingModule } from '@nestjs/testing';
import { BookCopiesService } from './book-copies.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { BookCopyNotFoundException } from '../../common/exceptions/book-copy-not-found.exception';

describe('BookCopiesService', () => {
  let service: BookCopiesService;
  const mockPrisma = {
    bookCopy: {
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
      providers: [BookCopiesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<BookCopiesService>(BookCopiesService);
    jest.clearAllMocks();
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  it('findOne() ném BookCopyNotFoundException nếu không tìm thấy', async () => {
    mockPrisma.bookCopy.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(BookCopyNotFoundException);
  });
});
