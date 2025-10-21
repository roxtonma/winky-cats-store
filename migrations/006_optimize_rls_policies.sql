-- Migration: Optimize RLS Policies for Performance
-- Description: Wraps auth functions in subqueries to prevent re-evaluation per row
-- This improves query performance at scale by evaluating auth.uid() once instead of per-row
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- user_profiles table - Replace 3 policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================
-- user_addresses table - Replace 4 policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON user_addresses;

CREATE POLICY "Users can view own addresses"
  ON user_addresses FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own addresses"
  ON user_addresses FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own addresses"
  ON user_addresses FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own addresses"
  ON user_addresses FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- orders table - Replace 2 policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Service role can view all orders" ON orders;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id IS NULL -- Allow viewing of guest orders (backward compatibility)
  );

-- Admin/service role can view all orders
CREATE POLICY "Service role can view all orders"
  ON orders FOR SELECT
  USING ((SELECT auth.jwt()) ->> 'role' = 'service_role');

-- ============================================
-- Summary
-- ============================================

COMMENT ON TABLE user_profiles IS 'Extended user profile information including phone number for order placement. RLS policies optimized for performance.';
COMMENT ON TABLE user_addresses IS 'User delivery addresses for quick checkout. RLS policies optimized for performance.';
COMMENT ON TABLE orders IS 'Customer orders with payment tracking. RLS policies optimized for performance.';
