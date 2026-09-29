import { Test, TestingModule } from '@nestjs/testing';
import { BorrowRecordsService } from './borrow-records.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { CopyNotAvailableException } from '../../common/exceptions/copy-not-available.exception';
import { BorrowLimitExceededException } from '../../common/exceptions/borrow-limit-exceeded.exception';
import { AlreadyReturnedException } from '../../common/exceptions/already-returned.exception';
import { BorrowRecordNotFoundException } from '../../common/exceptions/borrow-record-not-found.exception';

describe('BorrowRecordsService', () => {
  let service: BorrowRecordsService;

  // Mock tx dùng chung cho mọi test - $transaction gọi thẳng callback với mock
  // này thay vì mở transaction Postgres thật.
  const tx = {
    borrowRecord: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    bookCopy: { updateMany: jest.fn(), update: jest.fn() },
  };

  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(tx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BorrowRecordsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<BorrowRecordsService>(BorrowRecordsService);
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback) => callback(tx));
  });

  describe('borrowBook', () => {
    it('ném BorrowLimitExceededException nếu độc giả đã mượn đủ giới hạn', async () => {
      tx.borrowRecord.count.mockResolvedValue(5); // = BORROW_MAX_BOOKS_PER_READER
      await expect(service.borrowBook({ copyId: 1, readerId: 1 })).rejects.toThrow(
        BorrowLimitExceededException,
      );
      expect(tx.bookCopy.updateMany).not.toHaveBeenCalled(); // chặn TRƯỚC khi đụng copy
    });

    it('ném CopyNotAvailableException nếu updateMany đổi được 0 dòng (đã có người mượn trước)', async () => {
      tx.borrowRecord.count.mockResolvedValue(0);
      tx.bookCopy.updateMany.mockResolvedValue({ count: 0 }); // guard nguyên tử thất bại
      await expect(service.borrowBook({ copyId: 1, readerId: 1 })).rejects.toThrow(
        CopyNotAvailableException,
      );
      expect(tx.borrowRecord.create).not.toHaveBeenCalled();
    });

    it('tạo phiếu mượn thành công khi còn hạn mức và copy available', async () => {
      tx.borrowRecord.count.mockResolvedValue(0);
      tx.bookCopy.updateMany.mockResolvedValue({ count: 1 });
      tx.borrowRecord.create.mockResolvedValue({ id: 1, status: 'borrowing' });

      const result = await service.borrowBook({ copyId: 1, readerId: 1 });
      expect(result).toEqual({ id: 1, status: 'borrowing' });
      expect(tx.borrowRecord.create).toHaveBeenCalled();
    });
  });

  describe('returnBook', () => {
    it('ném BorrowRecordNotFoundException nếu bản sao chưa từng được mượn', async () => {
      tx.borrowRecord.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      await expect(service.returnBook({ copyId: 1 })).rejects.toThrow(BorrowRecordNotFoundException);
    });

    it('ném AlreadyReturnedException nếu bản sao đã được trả trước đó', async () => {
      tx.borrowRecord.findFirst
        .mockResolvedValueOnce(null) // không có phiếu đang mở
        .mockResolvedValueOnce({ id: 1, status: 'returned' }); // nhưng có phiếu cũ đã trả
      await expect(service.returnBook({ copyId: 1 })).rejects.toThrow(AlreadyReturnedException);
    });

    it('ném AlreadyReturnedException nếu guard nguyên tử thất bại (đã bị request khác xử lý)', async () => {
      tx.borrowRecord.findFirst.mockResolvedValue({ id: 1, status: 'borrowing' });
      tx.borrowRecord.updateMany.mockResolvedValue({ count: 0 }); // guard thất bại
      await expect(service.returnBook({ copyId: 1 })).rejects.toThrow(AlreadyReturnedException);
    });

    it('trả sách thành công khi có phiếu đang mở', async () => {
      tx.borrowRecord.findFirst.mockResolvedValue({ id: 1, status: 'borrowing' });
      tx.borrowRecord.updateMany.mockResolvedValue({ count: 1 });
      tx.borrowRecord.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'returned' });

      const result = await service.returnBook({ copyId: 1 });
      expect(result).toEqual({ id: 1, status: 'returned' });
      expect(tx.bookCopy.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'available' } });
    });
  });
});
