-- Migration: Fix Order Number Generation - Create Sequence and Fix search_path References
-- Description: Fixes the generate_order_number() function to work with empty search_path
--              by using fully-qualified schema names for all PostgreSQL objects
--
-- PROBLEM: Migration 007 set search_path = '' for security, but the functions reference
--          unqualified objects (order_number_seq, NOW(), TO_CHAR(), etc.) which cannot
--          be found without a search path.
--
-- SOLUTION:
--   1. Create the missing order_number_seq sequence
--   2. Update ALL 5 functions to use fully-qualified names (public.* and pg_catalog.*)

-- ============================================
-- Step 1: Create order_number_seq sequence
-- ============================================

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

COMMENT ON SEQUENCE public.order_number_seq IS 'Sequence for generating unique order numbers in format ORD-YYYYMMDD-####';

-- ============================================
-- Step 2: Fix update_updated_at_column function
-- ============================================

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

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

-- Recreate all triggers that were dropped by CASCADE
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Step 3: Fix ensure_single_default_address function
-- ============================================

DROP FUNCTION IF EXISTS public.ensure_single_default_address() CASCADE;

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

CREATE TRIGGER ensure_one_default_address
  BEFORE INSERT OR UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();

-- ============================================
-- Step 4: Fix update_user_has_purchased function
-- ============================================

DROP FUNCTION IF EXISTS public.update_user_has_purchased() CASCADE;

CREATE OR REPLACE FUNCTION public.update_user_has_purchased()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user profile when an order is created with 'paid' status
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

CREATE TRIGGER track_first_purchase
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_has_purchased();

-- ============================================
-- Step 5: Fix generate_order_number function
-- ============================================

DROP FUNCTION IF EXISTS public.generate_order_number() CASCADE;

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

-- ============================================
-- Step 6: Fix set_order_number function
-- ============================================

DROP FUNCTION IF EXISTS public.set_order_number() CASCADE;

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

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- ============================================
-- Verification
-- ============================================

-- Test that the sequence exists:
-- SELECT * FROM pg_catalog.pg_sequences WHERE schemaname = 'public' AND sequencename = 'order_number_seq';

-- Test that order number generation now works:
-- SELECT public.generate_order_number();

-- Test by creating a test order (will be rolled back):
-- BEGIN;
-- INSERT INTO public.orders (customer_email, customer_name, customer_phone, total_amount, status)
-- VALUES ('test@example.com', 'Test User', '9876543210', 100.00, 'pending')
-- RETURNING order_number;
-- ROLLBACK;

-- ============================================
-- Summary
-- ============================================

-- This migration fixes the "function generate_order_number() does not exist" error by:
-- 1. Creating the missing order_number_seq sequence
-- 2. Updating all 5 functions to use fully-qualified schema names (public.* and pg_catalog.*)
--    when search_path is empty, which is required for security best practices
--
-- Functions fixed:
--   - update_updated_at_column (uses pg_catalog.now)
--   - ensure_single_default_address (uses public.user_addresses)
--   - update_user_has_purchased (uses public.user_profiles)
--   - generate_order_number (uses pg_catalog.* and public.order_number_seq)
--   - set_order_number (uses public.generate_order_number)
