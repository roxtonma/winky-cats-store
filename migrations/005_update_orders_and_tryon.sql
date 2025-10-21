-- Update orders table to link to authenticated users
-- Add user_id column to associate orders with user accounts

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast user order lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Update try_on_usage to support user-based tracking
ALTER TABLE try_on_usage
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for user-based try-on lookups
CREATE INDEX IF NOT EXISTS idx_try_on_user_id ON try_on_usage(user_id);

-- Add has_purchased flag to track if user has made a purchase (for try-on limits)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS has_purchased BOOLEAN DEFAULT false;

-- Function to update has_purchased flag when user makes first order
CREATE OR REPLACE FUNCTION update_user_has_purchased()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_first_purchase
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_has_purchased();

-- Enable Row Level Security on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IS NULL -- Allow viewing of guest orders (backward compatibility)
  );

-- Admin/service role can view all orders
CREATE POLICY "Service role can view all orders"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON COLUMN orders.user_id IS 'Links order to authenticated user account';
COMMENT ON COLUMN user_profiles.has_purchased IS 'True after user completes first order (used for try-on limit tiers)';
