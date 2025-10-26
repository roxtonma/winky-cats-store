-- ============================================
-- CONSOLIDATED SECURITY & RLS POLICIES
-- ============================================
-- This migration sets up Row Level Security policies for all tables
-- Replaces old migrations: 006, 009
-- Optimized for performance using subquery pattern
-- Date: 2025-01-XX
-- ============================================

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER_PROFILES policies
-- ============================================

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
-- USER_ADDRESSES policies
-- ============================================

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
-- ORDERS policies
-- ============================================

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id IS NULL -- Allow viewing of guest orders (backward compatibility)
  );

CREATE POLICY "Service role can view all orders"
  ON orders FOR SELECT
  USING ((SELECT auth.jwt()) ->> 'role' = 'service_role');

-- ============================================
-- ORDER_ITEMS policies
-- ============================================

-- Users can view order items that belong to their orders
CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

-- Admin/service role can view all order items
CREATE POLICY "Service role can view all order items"
  ON order_items FOR SELECT
  USING ((SELECT auth.jwt()) ->> 'role' = 'service_role');

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE user_profiles IS 'Extended user profile information including phone number for order placement. RLS policies optimized for performance.';
COMMENT ON TABLE user_addresses IS 'User delivery addresses for quick checkout. RLS policies optimized for performance.';
COMMENT ON TABLE orders IS 'Customer orders with payment tracking. RLS policies optimized for performance.';
COMMENT ON TABLE order_items IS 'Line items for orders. RLS policies allow users to view items from their own orders.';
