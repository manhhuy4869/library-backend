CREATE TABLE "access_roles" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_roles_pkey" PRIMARY KEY ("code")
);

CREATE UNIQUE INDEX "access_roles_name_key" ON "access_roles"("name");

CREATE TABLE "permissions" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("code")
);

CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

CREATE TABLE "role_permissions" (
    "roleCode" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleCode", "permissionCode")
);

INSERT INTO "access_roles" ("code", "name", "isSystem") VALUES
  ('admin', 'Admin', true),
  ('librarian', 'Thủ thư', true),
  ('student', 'Sinh viên', true);

INSERT INTO "permissions" ("code", "name", "description") VALUES
  ('book:read', 'Xem sách', 'Xem danh sách và chi tiết sách'),
  ('book:manage', 'Quản lý sách', 'Tạo, sửa và xóa đầu sách'),
  ('copy:manage', 'Quản lý bản sao', 'Tạo, sửa và xóa bản sao sách'),
  ('reader:manage', 'Quản lý độc giả', 'Xem, tạo, sửa và xóa hồ sơ độc giả'),
  ('borrow:manage', 'Quản lý mượn trả', 'Xem và xử lý phiếu mượn/trả, xem thống kê'),
  ('user:manage', 'Quản lý tài khoản', 'Quản lý tài khoản nhân viên'),
  ('reservation:create', 'Đặt lịch mượn', 'Tạo lịch đặt mượn sách'),
  ('reservation:read-own', 'Xem lịch của mình', 'Xem và hủy lịch đặt của chính mình'),
  ('reservation:manage', 'Xử lý lịch đặt', 'Xem lịch đặt và xác nhận cho mượn'),
  ('role:manage', 'Quản lý vai trò và quyền', 'Tạo role và gán permission cho role');

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
SELECT 'admin', "code" FROM "permissions";

INSERT INTO "role_permissions" ("roleCode", "permissionCode") VALUES
  ('librarian', 'book:read'),
  ('librarian', 'book:manage'),
  ('librarian', 'copy:manage'),
  ('librarian', 'reader:manage'),
  ('librarian', 'borrow:manage'),
  ('librarian', 'reservation:manage'),
  ('student', 'book:read'),
  ('student', 'reservation:create'),
  ('student', 'reservation:read-own');

ALTER TABLE "users" ADD CONSTRAINT "users_role_fkey"
  FOREIGN KEY ("role") REFERENCES "access_roles"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleCode_fkey"
  FOREIGN KEY ("roleCode") REFERENCES "access_roles"("code") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionCode_fkey"
  FOREIGN KEY ("permissionCode") REFERENCES "permissions"("code") ON DELETE CASCADE ON UPDATE CASCADE;