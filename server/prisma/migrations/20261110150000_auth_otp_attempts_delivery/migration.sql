-- Task 11: AuthOtp attempt tracking + resend metadata for OTP brute-force protection.
-- Additive only.

ALTER TABLE "AuthOtp" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AuthOtp" ADD COLUMN "last_sent_at" TIMESTAMP(3);
