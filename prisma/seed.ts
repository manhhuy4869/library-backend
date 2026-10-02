import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Dữ liệu mẫu lớn để demo/search/pagination - chạy: npx prisma db seed
async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash('admin123456', 10);
  await prisma.user.upsert({
    where: { username: 'thuthu' },
    update: {},
    create: { username: 'thuthu', password: hashedPassword, fullName: 'Thủ thư demo' },
  });
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { role: 'admin' },
    create: { username: 'admin', password: adminPassword, fullName: 'Quản trị viên demo', role: 'admin' },
  });

  const book = await prisma.book.upsert({
    where: { isbn: '9780000000000' },
    update: {},
    create: {
      title: 'Lập trình NestJS căn bản',
      author: 'Nguyễn Văn A',
      category: 'Công nghệ thông tin',
      isbn: '9780000000000',
    },
  });

  await prisma.bookCopy.createMany({
    data: [
      { bookId: book.id, copyCode: 'IT001-01', shelfRow: 'A', shelfColumn: '1', shelfLevel: '1' },
      { bookId: book.id, copyCode: 'IT001-02', shelfRow: 'A', shelfColumn: '1', shelfLevel: '2' },
      { bookId: book.id, copyCode: 'IT001-03', shelfRow: 'A', shelfColumn: '1', shelfLevel: '3' },
      { bookId: book.id, copyCode: 'IT001-04', shelfRow: 'A', shelfColumn: '1', shelfLevel: '4' },
      { bookId: book.id, copyCode: 'IT001-05', shelfRow: 'A', shelfColumn: '1', shelfLevel: '5' },
      { bookId: book.id, copyCode: 'IT001-06', shelfRow: 'A', shelfColumn: '1', shelfLevel: '6' },
      { bookId: book.id, copyCode: 'IT001-07', shelfRow: 'A', shelfColumn: '1', shelfLevel: '7' },
      { bookId: book.id, copyCode: 'IT001-08', shelfRow: 'A', shelfColumn: '1', shelfLevel: '8' },
      { bookId: book.id, copyCode: 'IT001-09', shelfRow: 'A', shelfColumn: '1', shelfLevel: '9' },
      { bookId: book.id, copyCode: 'IT001-10', shelfRow: 'A', shelfColumn: '1', shelfLevel: '10' },
    ],
    skipDuplicates: true,
  });

  const generatedBooks = Array.from({ length: 1200 }, (_, index) => {
    const number = index + 1;
    const isbn = `9780000${String(number).padStart(6, '0')}`;
    return {
      title: `Thư viện số - Tập ${number}`,
      author: ['Nguyễn Minh Anh', 'Trần Hoàng Nam', 'Lê Thu Hà', 'Phạm Quốc Bảo'][index % 4],
      category: ['Công nghệ thông tin', 'Kinh tế', 'Văn học', 'Ngoại ngữ', 'Khoa học'][index % 5],
      publisher: ['NXB Giáo dục', 'NXB Trẻ', 'NXB Khoa học và Kỹ thuật'][index % 3],
      isbn,
    };
  });

  await prisma.book.createMany({ data: generatedBooks, skipDuplicates: true });
  const seededBooks = await prisma.book.findMany({
    where: { isbn: { in: generatedBooks.map(({ isbn }) => isbn) } },
    select: { id: true, isbn: true },
  });
  const copies = seededBooks.flatMap((seededBook, index) => {
    const bookNumber = Number(seededBook.isbn?.slice(-6) ?? index + 1);
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((copyNumber) => ({
      bookId: seededBook.id,
      copyCode: `SEED-${String(bookNumber).padStart(4, '0')}-${copyNumber}`,
      shelfRow: String.fromCharCode(65 + (index % 8)),
      shelfColumn: String((index % 20) + 1),
      shelfLevel: String(copyNumber),
    }));
  });
  for (let offset = 0; offset < copies.length; offset += 500) {
    await prisma.bookCopy.createMany({ data: copies.slice(offset, offset + 500), skipDuplicates: true });
  }

  await prisma.reader.upsert({
    where: { studentCode: 'SV001' },
    update: {},
    create: { fullName: 'Trần Thị B', studentCode: 'SV001', className: 'CNTT01' },
  });

  const studentNames = ['Nguyễn Minh Anh', 'Trần Hoàng Nam', 'Lê Thu Hà', 'Phạm Quốc Bảo', 'Võ Ngọc Linh'];
  for (let index = 1; index <= 50; index += 1) {
    const suffix = String(index).padStart(3, '0');
    const fullName = studentNames[(index - 1) % studentNames.length];
    const studentCode = `SV${String(index + 1).padStart(3, '0')}`;
    const user = await prisma.user.upsert({
      where: { username: `sinhvien${suffix}` },
      update: { role: 'student' },
      create: {
        username: `sinhvien${suffix}`,
        password: hashedPassword,
        fullName,
        role: 'student',
      },
    });
    await prisma.reader.upsert({
      where: { studentCode },
      update: { userId: user.id },
      create: { fullName, studentCode, className: `CNTT${String(((index - 1) % 5) + 1).padStart(2, '0')}`, userId: user.id },
    });
  }

  const bookCount = await prisma.book.count();
  const copyCount = await prisma.bookCopy.count();
  console.log(`Đã seed: user "thuthu" (mật khẩu 123456), admin "admin" (mật khẩu admin123456), 50 tài khoản sinh viên (mật khẩu 123456), ${bookCount} đầu sách, ${copyCount} bản sao, ${await prisma.reader.count()} độc giả`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
