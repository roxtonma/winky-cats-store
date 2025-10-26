-- ============================================
-- CONSOLIDATED CORE SCHEMA MIGRATION
-- ============================================
-- This migration consolidates all table creations, functions, and triggers
-- Replaces old migrations: 001, 003, 004, 005, 007, 008
-- Date: 2025-01-XX
-- ============================================

-- ============================================
-- SEQUENCES
-- ============================================

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;
COMMENT ON SEQUENCE public.order_number_seq IS 'Sequence for generating unique order numbers in format ORD-YYYYMMDD-####';

-- ============================================
-- TABLES
-- ============================================

-- Try-On Usage Table
-- Tracks virtual try-on usage for rate limiting
CREATE TABLE IF NOT EXISTS try_on_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'phone')),
  product_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_try_on_identifier ON try_on_usage(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_try_on_last_attempt ON try_on_usage(last_attempt_at);
CREATE INDEX IF NOT EXISTS idx_try_on_user_id ON try_on_usage(user_id);

COMMENT ON TABLE try_on_usage IS 'Tracks virtual try-on usage for rate limiting purposes';
COMMENT ON COLUMN try_on_usage.identifier IS 'IP address or phone number (hashed for privacy)';
COMMENT ON COLUMN try_on_usage.identifier_type IS 'Type of identifier: ip or phone';
COMMENT ON COLUMN try_on_usage.product_id IS 'Optional product ID for tracking which products are tried on';
COMMENT ON COLUMN try_on_usage.attempt_count IS 'Number of attempts made';
COMMENT ON COLUMN try_on_usage.last_attempt_at IS 'Timestamp of the last try-on attempt';

-- User Profiles Table
-- Stores additional user information beyond Supabase Auth
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  has_purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT phone_format CHECK (phone_number ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT unique_phone UNIQUE (phone_number),
  CONSTRAINT unique_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone_number);

COMMENT ON TABLE user_profiles IS 'Extended user profile information including phone number for order placement';
COMMENT ON COLUMN user_profiles.phone_number IS 'Indian phone number (10 digits, starts with 6-9)';
COMMENT ON COLUMN user_profiles.has_purchased IS 'True after user completes first order (used for try-on limit tiers)';

-- User Addresses Table
-- Stores multiple delivery addresses per user
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT phone_format CHECK (phone_number ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT postal_code_format CHECK (postal_code ~ '^\d{6}$')
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = true;

COMMENT ON TABLE user_addresses IS 'User delivery addresses for quick checkout';
COMMENT ON COLUMN user_addresses.label IS 'User-friendly name for the address (Home, Office, etc.)';
COMMENT ON COLUMN user_addresses.is_default IS 'Default address shown first during checkout';

-- Update orders table to link to authenticated users
-- (Assumes orders table already exists from Supabase setup)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

COMMENT ON COLUMN orders.user_id IS 'Links order to authenticated user account';

-- Update categories table to add is_active flag
-- This allows us to show/hide categories in the frontend filters based on products-config.json
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

COMMENT ON COLUMN categories.is_active IS 'Whether this category is active and should be shown in frontend filters. Synced from products-config.json active flag.';

-- ============================================
-- FUNCTIONS (with security-hardened search_path)
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updates the updated_at timestamp. Secured with immutable search_path.';

-- Function: Ensure only one default address per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ensure_single_default_address() IS 'Ensures only one default address per user. Secured with immutable search_path.';

-- Function: Track first purchase for user tier system
CREATE OR REPLACE FUNCTION public.update_user_has_purchased()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'paid' AND NEW.user_id IS NOT NULL THEN
    UPDATE public.user_profiles
    SET has_purchased = true
    WHERE user_id = NEW.user_id
      AND has_purchased = false;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_user_has_purchased() IS 'Tracks first purchase for user tier system. Secured with immutable search_path.';

-- Function: Generate unique order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'ORD-' ||
         pg_catalog.to_char(pg_catalog.now(), 'YYYYMMDD') ||
         '-' ||
         pg_catalog.lpad(pg_catalog.nextval('public.order_number_seq')::TEXT, 4, '0');
END;
$$;

COMMENT ON FUNCTION public.generate_order_number() IS 'Generates unique order numbers. Secured with immutable search_path.';

-- Function: Auto-generate order numbers on insert
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_order_number() IS 'Auto-generates order numbers on insert. Secured with immutable search_path.';

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update updated_at for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for user_addresses
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Ensure one default address per user
CREATE TRIGGER ensure_one_default_address
  BEFORE INSERT OR UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();

-- Trigger: Track first purchase
CREATE TRIGGER track_first_purchase
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_has_purchased();

-- Trigger: Auto-generate order numbers
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();
