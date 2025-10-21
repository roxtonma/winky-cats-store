-- Migration: Create users table for phone-based authentication (FUTURE)
-- Description: Implements phone authentication system with purchase tracking
-- Status: NOT YET IMPLEMENTED - For future use when phone auth is ready
-- Date: TBD
-- Author: Claude Code Review

-- NOTE: This migration is for future implementation when you're ready to add phone authentication
-- DO NOT RUN THIS YET - This is documentation for the planned feature

-- Create users table for phone authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  has_purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Create index for verified users
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(phone_verified) WHERE phone_verified = TRUE;

-- Add user_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create index for user orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- Create OTP verification table for phone auth
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone, created_at DESC);

-- Add comments
COMMENT ON TABLE users IS 'User accounts with phone-based authentication';
COMMENT ON COLUMN users.phone IS 'User phone number (E.164 format recommended)';
COMMENT ON COLUMN users.phone_verified IS 'Whether phone number has been verified via OTP';
COMMENT ON COLUMN users.has_purchased IS 'Whether user has made at least one successful purchase';

COMMENT ON TABLE otp_verifications IS 'OTP codes for phone verification';
COMMENT ON COLUMN otp_verifications.otp_code IS 'One-time password (should be hashed)';
COMMENT ON COLUMN otp_verifications.expires_at IS 'OTP expiration timestamp (typically 5-10 minutes from creation)';
COMMENT ON COLUMN otp_verifications.attempts IS 'Number of verification attempts (limit to 3-5)';

-- Function to automatically update has_purchased when order is confirmed
CREATE OR REPLACE FUNCTION update_user_purchase_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.user_id IS NOT NULL THEN
    UPDATE users
    SET has_purchased = TRUE, updated_at = NOW()
    WHERE id = NEW.user_id AND has_purchased = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update has_purchased on order confirmation
CREATE TRIGGER trigger_update_purchase_status
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
  EXECUTE FUNCTION update_user_purchase_status();
