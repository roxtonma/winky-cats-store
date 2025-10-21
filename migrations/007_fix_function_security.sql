-- Migration: Fix Function Security - Set Immutable search_path
-- Description: Prevents search path confusion attacks by explicitly setting search_path
-- Reference: https://supabase.com/docs/guides/database/postgres/security-best-practices#search_path-security

-- ============================================
-- Fix: update_updated_at_column function
-- ============================================

-- Drop the existing function and all dependent triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recreate with security-hardened search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column() IS 'Updates the updated_at timestamp. Secured with immutable search_path.';

-- Recreate all triggers that were dropped by CASCADE
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Fix: ensure_single_default_address function
-- ============================================

-- Drop the existing function and dependent trigger
DROP FUNCTION IF EXISTS ensure_single_default_address() CASCADE;

-- Recreate with security-hardened search_path
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION ensure_single_default_address() IS 'Ensures only one default address per user. Secured with immutable search_path.';

-- Recreate trigger that was dropped by CASCADE
CREATE TRIGGER ensure_one_default_address
  BEFORE INSERT OR UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- ============================================
-- Fix: update_user_has_purchased function
-- ============================================

-- Drop the existing function and dependent trigger
DROP FUNCTION IF EXISTS update_user_has_purchased() CASCADE;

-- Recreate with security-hardened search_path
CREATE OR REPLACE FUNCTION update_user_has_purchased()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user profile when an order is created with 'paid' status
  IF NEW.status = 'paid' AND NEW.user_id IS NOT NULL THEN
    UPDATE user_profiles
    SET has_purchased = true
    WHERE user_id = NEW.user_id
      AND has_purchased = false;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_user_has_purchased() IS 'Tracks first purchase for user tier system. Secured with immutable search_path.';

-- Recreate trigger that was dropped by CASCADE
CREATE TRIGGER track_first_purchase
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_has_purchased();

-- ============================================
-- Fix: generate_order_number function
-- ============================================

-- Drop the existing function (no dependent triggers)
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;

-- Recreate with security-hardened search_path
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
END;
$$;

COMMENT ON FUNCTION generate_order_number() IS 'Generates unique order numbers. Secured with immutable search_path.';

-- ============================================
-- Fix: set_order_number function
-- ============================================

-- Drop the existing function and dependent trigger
DROP FUNCTION IF EXISTS set_order_number() CASCADE;

-- Recreate with security-hardened search_path
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_order_number() IS 'Auto-generates order numbers on insert. Secured with immutable search_path.';

-- Recreate trigger that was dropped by CASCADE
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- ============================================
-- Summary
-- ============================================

-- All 5 functions now have SET search_path = '' which prevents search path confusion attacks
-- This protects against malicious users creating shadow tables/functions to hijack function calls
-- Functions secured: update_updated_at_column, ensure_single_default_address, update_user_has_purchased, generate_order_number, set_order_number
