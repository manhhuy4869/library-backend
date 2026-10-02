# library-backend

NestJS + Prisma + PostgreSQL + Redis. Repo/project độc lập (khác repo với frontend).
Cấu trúc tham khảo trực tiếp từ [buqiyuan/nest-admin](https://github.com/buqiyuan/nest-admin),
chọn lọc theo quy mô đồ án (bỏ RBAC đầy đủ menu/dept/post/dict).

## Cấu trúc thư mục

```
src/
├── modules/                 # MỌI module nghiệp vụ nằm ở đây
│   ├── auth/                 # Đăng nhập, JWT access+refresh token
│   │   ├── dto/
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── user/                 # Tài khoản thủ thư (auth dùng tới)
│   ├── books/                 # CRUD sách - đã code mẫu đầy đủ + unit test + cache
│   ├── book-copies/           # Bản sao vật lý (mã vạch, vị trí kệ)
│   ├── readers/                # CRUD độc giả
│   ├── borrow-records/         # Mượn/trả - nghiệp vụ transaction
│   ├── health/                  # GET /api/health - Terminus check DB
│   └── tasks/                    # Cron - overdue.task.ts tự đánh dấu quá hạn
├── shared/                  # Hạ tầng dùng chung, gom vào 1 SharedModule duy nhất
│   ├── database/
│   │   ├── constraints/
│   │   │   ├── unique.constraint.ts       # @IsUnique(model, field)
│   │   │   └── entity-exist.constraint.ts # @EntityExists(model)
│   │   ├── prisma.service.ts
│   │   └── database.module.ts
│   ├── redis/
│   │   ├── redis.module.ts
│   │   ├── redis.service.ts
│   │   └── redis.constants.ts
│   ├── logger/
│   │   └── logger.module.ts     # Pino - log JSON có cấu trúc
│   └── shared.module.ts         # import 1 lần ở app.module.ts, thay vì 3 dòng riêng
├── common/                  # Thứ dùng chéo nhiều module, KHÔNG chứa nghiệp vụ
│   ├── dto/
│   │   └── pagination.dto.ts    # page/pageSize dùng chung mọi API danh sách
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts   # @Roles(Role.ADMIN)
│   ├── guards/
│   │   └── roles.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   ├── transform.interceptor.ts  # chuẩn hóa response { data, timestamp }
│   │   └── logging.interceptor.ts
│   ├── pipes/
│   │   └── parse-int.pipe.ts
│   └── middleware/
│       └── logger.middleware.ts
├── constants/                # Hằng số toàn cục (KHÔNG còn nằm trong common/)
│   ├── business.constants.ts   # BORROW_DEFAULT_DAYS, BORROW_MAX_BOOKS_PER_READER...
│   ├── error-messages.constants.ts
│   ├── response-code.constant.ts  # ResponseCode.SUCCESS/ERROR - business code, khác HTTP status
│   └── roles.enum.ts
├── types/                    # Type/interface dùng chung (KHÔNG còn nằm trong common/)
│   ├── paginated-result.interface.ts
│   ├── jwt-payload.interface.ts
│   └── api-response.interface.ts  # shape DUY NHẤT cho mọi response (thành công lẫn lỗi)
├── config/                   # Cấu hình theo namespace, có barrel index.ts
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── redis.config.ts
│   ├── validation.schema.ts  # Joi - crash ngay lúc start nếu thiếu env bắt buộc
│   └── index.ts               # export gộp - import { appConfig, ... } from './config'
├── global/
│   └── env.ts                 # augment NodeJS.ProcessEnv - gõ process.env có gợi ý, báo lỗi sai tên biến
├── helper/
│   ├── paginate/
│   │   └── paginate.helper.ts # buildPaginatedResult(), getSkipTake() dùng chung
│   └── catch-error.helper.ts
├── app.module.ts
├── main.ts
└── setup-swagger.ts          # tách riêng khỏi main.ts cho bootstrap() gọn
test/
├── app.e2e-spec.ts
└── jest-e2e.json
prisma/
└── schema.prisma
Dockerfile
docker-compose.yml            # postgres + redis + backend
```

## Khác biệt so với cấu trúc "phẳng" trước đây

| | Trước | Giờ (theo nest-admin) |
|---|---|---|
| Module nghiệp vụ | Nằm thẳng dưới `src/` | Gom hết vào `src/modules/` |
| DB/Redis/Logger | 3 module import riêng ở `app.module.ts` | Gộp 1 `SharedModule`, import 1 dòng |
| Hằng số, type dùng chung | Trong `common/constants`, `common/interfaces` | Tách hẳn thành `src/constants/`, `src/types/` cấp cao nhất |
| Swagger setup | Viết thẳng trong `main.ts` | Tách riêng `setup-swagger.ts` |
| Biến môi trường | Chỉ có Joi validate | Thêm `global/env.ts` augment type cho `process.env` |

Lý do tách `modules/` riêng: khi project lớn dần (thêm auth phức tạp hơn, thêm
report, thêm notification...), `src/` cấp cao nhất chỉ có vài thư mục hạ tầng cố
định (`shared`, `common`, `config`...) + 1 thư mục `modules` duy nhất phình to bên
trong — dễ quét mắt hơn nhiều so với hàng chục module nằm ngang hàng với
`common`/`config` ở gốc.

## Bảo mật & vận hành cấp doanh nghiệp

- **JWT guard GLOBAL** (`APP_GUARD` trong `app.module.ts`) — MẶC ĐỊNH mọi route
  yêu cầu đăng nhập, trừ route đánh dấu `@Public()` (`auth/login`, `auth/refresh`,
  `health`). An toàn hơn hẳn việc phải nhớ gắn `@UseGuards()` từng route thủ công —
  quên 1 chỗ là hở API.
- **Rate limiting** (`@nestjs/throttler`) — mặc định 100 request/phút/IP toàn hệ
  thống, riêng `POST /auth/login` siết còn 5 lần/phút/IP chống brute-force dò mật
  khẩu. Thứ tự guard: Throttler chạy TRƯỚC JwtAuthGuard (chặn spam trước khi tốn
  công decode JWT).
- **Helmet** — set HTTP header bảo mật chuẩn (X-Frame-Options, HSTS...).
- **Compression** — nén gzip response, giảm băng thông với payload JSON lớn.
- **`trust proxy`** — bắt buộc khi deploy sau Nginx/Cloudflare/ALB, thiếu thì rate
  limit theo IP bị sai (nhận nhầm IP của proxy).
- **Graceful shutdown** (`enableShutdownHooks()`) — khi nhận SIGTERM (Docker/K8s
  restart/deploy), app hoàn tất request đang xử lý + đóng kết nối DB/Redis sạch,
  không cắt ngang giữa chừng.

## Vận hành & phát triển tiếp

- **API versioning** — `app.enableVersioning({ type: URI, defaultVersion: '1' })`
  trong `main.ts`. Mọi route hiện có tự động lên `/api/v1/...` mà không cần sửa
  từng controller. Route có breaking change sau này khai báo `@Version('2')`
  riêng. `health` cố tình đứng ngoài version (`VERSION_NEUTRAL`) vì load balancer
  luôn gọi cố định 1 đường dẫn.
- **Request ID** — `shared/logger/logger.module.ts` gắn `genReqId`, mỗi request có
  1 UUID (hoặc lấy từ header `X-Request-Id` nếu proxy đã gắn sẵn), trả lại qua
  response header cùng tên. Mọi dòng log Pino trong 1 request đều chung
  `requestId` — debug 1 lỗi cụ thể chỉ cần filter theo ID đó.
- **CI** (`.github/workflows/ci.yml`) — mỗi lần push/PR vào `main`/`develop`: dựng
  PostgreSQL + Redis thật (GitHub Actions services), chạy `lint` → `prisma migrate`
  → `test` → `test:e2e` → `build`. Lỗi bị chặn ở PR, không lọt vào `main`.

## Cài đặt

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
```

## Chạy dev

```bash
npm run dev
```

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/api/health

## Test

```bash
npm run test
npm run test:e2e
```

## Dữ liệu mẫu (seed)

```bash
npx prisma db seed
```

Tạo sẵn tài khoản thủ thư `thuthu` (mật khẩu `123456`), tài khoản admin `admin`
(mật khẩu `admin123456`), 50 tài khoản sinh viên `sinhvien001`–`sinhvien050`
(mật khẩu `123456`), hồ sơ độc giả tương ứng, 1.200 đầu sách có 10 bản sao mỗi
đầu sách và 1 sách NestJS mẫu có 10 bản sao.

## Lint & format

```bash
npm run lint
npm run format
```

## Chuẩn hóa response

**Middleware không làm được việc này** — nó chạy trước khi route xử lý, chưa có
response body để transform (xem bảng Middleware vs Guard vs Interceptor ở trên).
Chuẩn hóa response là việc của cặp **Interceptor + Filter**, cả hai dùng chung
1 shape `ApiResponse` (`types/api-response.interface.ts`):

```json
{ "code": 0, "message": "success", "data": { ... }, "timestamp": "..." }
```

- `common/interceptors/transform.interceptor.ts` — bọc mọi response THÀNH CÔNG
  vào shape trên, `code: ResponseCode.SUCCESS`
- `common/filters/http-exception.filter.ts` — bắt MỌI lỗi (kể cả lỗi hệ thống
  không phải `HttpException`, ví dụ lỗi Prisma), trả cùng shape với
  `code: ResponseCode.ERROR`, log đầy đủ stack trace cho lỗi không lường trước
  nhưng không lộ chi tiết đó ra response

FE luôn đọc `data`/`message`/`code` ở đúng 1 chỗ, không phải xử lý 2 shape khác
nhau tùy request thành công hay thất bại.

## Exception & validation

Mỗi exception mang theo `errorCode` (`constants/error-code.constant.ts`) — mã lỗi
CỤ THỂ khác `code` (chỉ có SUCCESS/ERROR chung chung). FE switch theo `errorCode`
để xử lý riêng từng trường hợp thay vì so sánh chuỗi message:

```json
{ "code": 1, "errorCode": 2003, "message": "Bản sao sách này hiện không có sẵn để mượn", "data": null, "timestamp": "..." }
```

**Validate input** (`class-validator` qua DTO) không còn trả mảng message gộp
chung — `main.ts` gắn `exceptionFactory` cho `ValidationPipe`, format lại thành
`ValidationException` mang lỗi theo TỪNG FIELD:

```json
{ "code": 1, "errorCode": 1001, "message": "Dữ liệu không hợp lệ",
  "data": { "title": ["title should not be empty"] }, "timestamp": "..." }
```

FE map thẳng `data` vào form, highlight đúng field sai — không phải parse chuỗi.

## Validate dùng chung

- **`common/dto/pagination.dto.ts`** — `PaginationDto` (`page`, `pageSize`), mọi DTO
  danh sách `extends` từ đây thay vì viết lại (xem mẫu `modules/books/dto/search-book.dto.ts`).
  Đi kèm `helper/paginate/paginate.helper.ts` (`getSkipTake`, `buildPaginatedResult`)
  dùng trong service.
- **`shared/database/constraints/`** — validator BẤT ĐỒNG BỘ, gọi thẳng DB:
  - `@IsUnique('reader', 'studentCode')` — báo lỗi validate ngay nếu giá trị đã tồn tại
    (mẫu ở `readers/dto/create-reader.dto.ts`)
  - `@EntityExists('bookCopy')` — báo lỗi validate ngay nếu id không tồn tại, thay vì
    để lọt xuống service rồi mới ném `NotFoundException` riêng lẻ (mẫu ở
    `borrow-records/dto/borrow-book.dto.ts`)

  Cần `useContainer(app.select(AppModule), { fallbackOnErrors: true })` trong
  `main.ts` — class-validator mặc định tự `new()` validator, không qua DI container
  của Nest nên không inject được `PrismaService`. Thiếu dòng này thì `@IsUnique`/
  `@EntityExists` báo lỗi runtime khi validate.

## Custom exceptions

`common/exceptions/` — lỗi nghiệp vụ theo domain thay vì `NotFoundException`/
`BadRequestException` chung chung: `BookNotFoundException`, `ReaderNotFoundException`,
`CopyNotAvailableException`, `BorrowLimitExceededException`,
`BorrowRecordNotFoundException`, `AlreadyReturnedException`, `ValidationException`.
Tất cả message lấy từ `constants/error-messages.constants.ts`, mỗi exception mang
theo `errorCode` riêng từ `constants/error-code.constant.ts`.

## Thống kê

`GET /statistics/overview` — đúng yêu cầu đề tài gốc ("thống kê đơn giản số
lượng sách và tình hình mượn – trả"), chỉ đếm (không xếp hạng/phân tích phức
tạp): tổng đầu sách, tổng bản sao (có sẵn/đang mượn/mất-hỏng), tổng độc giả,
đang mượn, quá hạn, lượt mượn/trả trong tháng. Chạy song song bằng `Promise.all`.

## Lưu ý validate khi UPDATE (đã vá)

`@IsUnique` trên field như `copyCode`/`studentCode`/`username` chỉ nên áp cho
DTO **create**. Nếu để `UpdateXxxDto` kế thừa nguyên field đó qua `PartialType`,
sửa 1 bản ghi mà GIỮ NGUYÊN giá trị cũ sẽ bị validator coi là "trùng với chính
nó" và báo lỗi sai (VD: sửa vị trí kệ của `book-copies` mà không đổi `copyCode`
→ lỗi "đã tồn tại"). Cách vá: `Update*Dto` dùng `OmitType` bỏ field đó ra khỏi
`PartialType`, rồi khai báo lại field KHÔNG có `@IsUnique`. Tính duy nhất khi
THỰC SỰ đổi giá trị vẫn được đảm bảo bởi `@unique` ở Prisma schema + P2002
handler trong `HttpExceptionFilter`. Áp dụng ở `book-copies`, `readers`, `user`.

## Ghi log ra file (môi trường không phải development)

`shared/logger/logger.module.ts`: console và file đều dùng cùng định dạng dễ đọc
(`pino-pretty`). File tự xoay theo ngày, ví dụ `logs/app-2026-10-02.log`, và đổi
tên lúc nửa đêm theo giờ local. Thư mục log được tạo tự động nếu chưa có.
`docker-compose.yml` đã mount volume `./logs:/app/logs` để log không mất khi
container bị xóa/restart.

## Trạng thái hiện tại

- `modules/books/`, `modules/readers/`, `modules/book-copies/`, `modules/borrow-records/`,
  `modules/user/`, `modules/auth/` — CRUD/nghiệp vụ đầy đủ
- `modules/statistics/` — thống kê tổng quan (đúng yêu cầu đề tài gốc)
- `modules/health/`, `modules/tasks/`, `shared/*`, `common/*` — hạ tầng hoàn thiện

**Toàn bộ 6 module nghiệp vụ đã CODE XONG.** Mọi chỗ dùng trạng thái enum
(`BookCopyStatus`, `BorrowStatus`) đều import trực tiếp từ `@prisma/client`, không
dùng string literal tay — tránh lỗi TypeScript kiểu không khớp.

## Quy trình làm việc

1. Điền nghiệp vụ vào 1 module trong `modules/` theo mẫu `books/`.
2. Dùng `@nestjs/swagger` decorator trên DTO/Controller.
3. Test qua Swagger UI, viết kèm unit test (mock `PrismaService` + `RedisService`).
4. `borrow-records/borrow-records.service.ts` cần `this.prisma.$transaction(...)`
   khi mượn/trả, tương đương `DB::transaction()` + `lockForUpdate()` bên Laravel.
