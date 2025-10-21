-- Migration: Create try_on_usage table for tracking AI try-on usage
-- Description: Implements rate limiting for virtual try-on feature
-- Date: 2025-01-XX
-- Author: Claude Code Review

-- Create try_on_usage table
CREATE TABLE IF NOT EXISTS try_on_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'phone')),
  product_id TEXT,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by identifier
CREATE INDEX IF NOT EXISTS idx_try_on_identifier ON try_on_usage(identifier, identifier_type);

-- Create index for cleanup queries (finding old records)
CREATE INDEX IF NOT EXISTS idx_try_on_last_attempt ON try_on_usage(last_attempt_at);

-- Add comment to table
COMMENT ON TABLE try_on_usage IS 'Tracks virtual try-on usage for rate limiting purposes';
COMMENT ON COLUMN try_on_usage.identifier IS 'IP address or phone number (hashed for privacy)';
COMMENT ON COLUMN try_on_usage.identifier_type IS 'Type of identifier: ip or phone';
COMMENT ON COLUMN try_on_usage.product_id IS 'Optional product ID for tracking which products are tried on';
COMMENT ON COLUMN try_on_usage.attempt_count IS 'Number of attempts made';
COMMENT ON COLUMN try_on_usage.last_attempt_at IS 'Timestamp of the last try-on attempt';
