CREATE TABLE "fine_policies" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "lateReturnPerDay" INTEGER NOT NULL DEFAULT 5000,
  "damagedBookFee" INTEGER NOT NULL DEFAULT 50000,
  "lostBookFee" INTEGER NOT NULL DEFAULT 200000,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fine_policies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fine_policies_singleton_check" CHECK ("id" = 1)
);

INSERT INTO "fine_policies" ("id", "lateReturnPerDay", "damagedBookFee", "lostBookFee")
VALUES (1, 5000, 50000, 200000);

INSERT INTO "permissions" ("code", "name", "description")
VALUES ('fine-policy:manage', 'Điều chỉnh quy định phạt', 'Thay đổi mức phạt và xem lịch sử điều chỉnh');

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
VALUES ('admin', 'fine-policy:manage');