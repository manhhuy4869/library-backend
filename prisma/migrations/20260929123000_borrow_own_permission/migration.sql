INSERT INTO "permissions" ("code", "name", "description") VALUES
  ('borrow:read-own', 'Xem phiếu mượn của mình', 'Xem các sách đang mượn và quá hạn của chính mình');

INSERT INTO "role_permissions" ("roleCode", "permissionCode") VALUES
  ('admin', 'borrow:read-own'),
  ('student', 'borrow:read-own');