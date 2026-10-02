CREATE TYPE "StudentApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "users"
ADD COLUMN "approvalStatus" "StudentApprovalStatus" NOT NULL DEFAULT 'approved';