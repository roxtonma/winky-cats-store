-- ============================================
-- WINKY CATS STORE - CONSOLIDATED DATABASE SCHEMA
-- ============================================
-- This migration consolidates all previous migrations into a single comprehensive schema
-- Created: 2025-01-31
-- ============================================

-- ============================================
-- SEQUENCES
-- ============================================

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;
COMMENT ON SEQUENCE public.order_number_seq IS 'Sequence for generating unique order numbers in format ORDYYMMDD#### (13 chars, no special chars for Qikink)';

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

-- ============================================
-- SCHEMA MODIFICATIONS TO EXISTING TABLES
-- ============================================

-- Update orders table to link to authenticated users
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

COMMENT ON COLUMN orders.user_id IS 'Links order to authenticated user account';

-- Add Qikink print-on-demand integration fields
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS qikink_order_id TEXT,
ADD COLUMN IF NOT EXISTS qikink_forwarded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qikink_error_log JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_qikink_order_id ON orders(qikink_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_qikink_forwarded_at ON orders(qikink_forwarded_at DESC);

COMMENT ON COLUMN orders.qikink_order_id IS 'Qikink internal order ID returned from their API';
COMMENT ON COLUMN orders.qikink_forwarded_at IS 'Timestamp when order was successfully forwarded to Qikink';
COMMENT ON COLUMN orders.qikink_error_log IS 'JSON log of any errors encountered when forwarding to Qikink';

-- Update categories table to add is_active flag
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

COMMENT ON COLUMN categories.is_active IS 'Whether this category is active and should be shown in frontend filters. Synced from products-config.json active flag.';

-- Add variant tracking to order_items
-- This allows orders to display the specific product variant that was ordered
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variant_size TEXT,
ADD COLUMN IF NOT EXISTS variant_color TEXT,
ADD COLUMN IF NOT EXISTS variant_color_name TEXT,
ADD COLUMN IF NOT EXISTS variant_image TEXT;

COMMENT ON COLUMN order_items.variant_size IS 'Size variant selected (e.g., S, M, L, XL)';
COMMENT ON COLUMN order_items.variant_color IS 'Color hex value of selected variant';
COMMENT ON COLUMN order_items.variant_color_name IS 'Human-readable color name (e.g., Red, Blue, Black)';
COMMENT ON COLUMN order_items.variant_image IS 'Image URL for the specific variant ordered';

CREATE INDEX IF NOT EXISTS idx_order_items_variant_color_name ON order_items(variant_color_name);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_size ON order_items(variant_size);

-- Add featured flag to products table
-- Allows manual curation of products for home page carousel
ALTER TABLE products
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_featured_active ON products(featured, is_active) WHERE featured = true AND is_active = true;

COMMENT ON COLUMN products.featured IS 'Flag to indicate if product should be featured on home page carousel';

-- Add product detail fields for enhanced product information display
ALTER TABLE products
ADD COLUMN IF NOT EXISTS fabric_details TEXT,
ADD COLUMN IF NOT EXISTS fit_info TEXT,
ADD COLUMN IF NOT EXISTS care_instructions TEXT;

COMMENT ON COLUMN products.fabric_details IS 'Detailed fabric information (e.g., "100% cotton with 180 GSM for lightweight comfort")';
COMMENT ON COLUMN products.fit_info IS 'Fit description (e.g., "Perfect unisex regular fit – your go-to everyday tee")';
COMMENT ON COLUMN products.care_instructions IS 'Care and washing instructions for the product';

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
  RETURN 'ORD' ||
         pg_catalog.to_char(pg_catalog.now(), 'YYMMDD') ||
         pg_catalog.lpad(pg_catalog.nextval('public.order_number_seq')::TEXT, 4, '0');
END;
$$;

COMMENT ON FUNCTION public.generate_order_number() IS 'Generates unique order numbers in format ORDYYMMDD#### (13 chars, no special chars for Qikink). Secured with immutable search_path.';

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
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for products
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at for user_addresses
DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Ensure one default address per user
DROP TRIGGER IF EXISTS ensure_one_default_address ON public.user_addresses;
CREATE TRIGGER ensure_one_default_address
  BEFORE INSERT OR UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();

-- Trigger: Track first purchase
DROP TRIGGER IF EXISTS track_first_purchase ON public.orders;
CREATE TRIGGER track_first_purchase
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_has_purchased();

-- Trigger: Auto-generate order numbers
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- USER_PROFILES policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- USER_ADDRESSES policies
DROP POLICY IF EXISTS "Users can view own addresses" ON user_addresses;
CREATE POLICY "Users can view own addresses"
  ON user_addresses FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON user_addresses;
CREATE POLICY "Users can insert own addresses"
  ON user_addresses FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON user_addresses;
CREATE POLICY "Users can update own addresses"
  ON user_addresses FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON user_addresses;
CREATE POLICY "Users can delete own addresses"
  ON user_addresses FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ORDERS policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id IS NULL -- Allow viewing of guest orders (backward compatibility)
  );

DROP POLICY IF EXISTS "Service role can view all orders" ON orders;
CREATE POLICY "Service role can view all orders"
  ON orders FOR SELECT
  USING ((SELECT auth.jwt()) ->> 'role' = 'service_role');

-- ORDER_ITEMS policies
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role can view all order items" ON order_items;
CREATE POLICY "Service role can view all order items"
  ON order_items FOR SELECT
  USING ((SELECT auth.jwt()) ->> 'role' = 'service_role');

-- ============================================
-- CUSTOM DESIGN REQUESTS TABLE
-- ============================================
-- Stores custom design requests submitted via /customize page

CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Request details
  product_type TEXT NOT NULL,
  design_brief TEXT NOT NULL,
  budget TEXT NOT NULL,

  -- File tracking
  has_reference_images BOOLEAN DEFAULT false,
  reference_image_count INTEGER DEFAULT 0,
  reference_image_urls TEXT[] DEFAULT '{}',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'quoted', 'in_progress', 'completed', 'rejected')),
  admin_notes TEXT,
  quoted_price DECIMAL(10, 2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for custom_requests
CREATE INDEX IF NOT EXISTS idx_custom_requests_user_id ON custom_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_requests_created_at ON custom_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email);

COMMENT ON TABLE custom_requests IS 'Stores custom design requests from the /customize page';
COMMENT ON COLUMN custom_requests.product_type IS 'Type of product: t-shirt, hoodie, notebook, phone-cover, tote-bag, mug, stickers, other';
COMMENT ON COLUMN custom_requests.design_brief IS 'Customer description of their design idea';
COMMENT ON COLUMN custom_requests.budget IS 'Budget range selected: 399-499, 500-699, 700-999, 1000+';
COMMENT ON COLUMN custom_requests.reference_image_urls IS 'Array of Supabase storage URLs for reference images uploaded by the customer';
COMMENT ON COLUMN custom_requests.status IS 'Request status: pending (new), reviewing (being evaluated), quoted (price sent), in_progress (being made), completed, rejected';
COMMENT ON COLUMN custom_requests.admin_notes IS 'Internal notes for tracking communication and decisions';
COMMENT ON COLUMN custom_requests.quoted_price IS 'Final quoted price for the custom design';

-- Trigger: Update updated_at for custom_requests
DROP TRIGGER IF EXISTS update_custom_requests_updated_at ON custom_requests;
CREATE TRIGGER update_custom_requests_updated_at
  BEFORE UPDATE ON custom_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security for custom_requests
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- CUSTOM_REQUESTS policies
DROP POLICY IF EXISTS "Users can view own requests" ON custom_requests;
CREATE POLICY "Users can view own requests"
  ON custom_requests FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id IS NULL -- Allow viewing guest requests (if they know the ID)
  );

DROP POLICY IF EXISTS "Anyone can create requests" ON custom_requests;
CREATE POLICY "Anyone can create requests"
  ON custom_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON custom_requests;
CREATE POLICY "Service role full access"
  ON custom_requests FOR ALL
  USING ((SELECT auth.jwt()) ->> 'role' = 'service_role');

-- ============================================
-- NEWSLETTER & DISCOUNT CODE SYSTEM
-- ============================================

-- Newsletter Subscribers Table
-- Stores email newsletter subscriptions with associated welcome discount codes
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  discount_code TEXT NOT NULL,
  discount_code_used BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  unsubscribe_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_discount_code ON newsletter_subscribers(discount_code);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribe_token ON newsletter_subscribers(unsubscribe_token);

COMMENT ON TABLE newsletter_subscribers IS 'Email newsletter subscriptions with automatically generated welcome discount codes';
COMMENT ON COLUMN newsletter_subscribers.discount_code IS 'Unique discount code sent to subscriber (format: WELCOME10-XXXXXX)';
COMMENT ON COLUMN newsletter_subscribers.discount_code_used IS 'True if the discount code has been used in an order';
COMMENT ON COLUMN newsletter_subscribers.unsubscribe_token IS 'Unique token for unsubscribe link';

-- Discount Codes Table
-- Stores all discount/promo codes with validation rules
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (valid_from < valid_until OR valid_until IS NULL),
  CONSTRAINT usage_limits CHECK (current_uses <= max_uses OR max_uses IS NULL),
  CONSTRAINT percentage_range CHECK (type != 'percentage' OR (value >= 0 AND value <= 100))
);

CREATE INDEX IF NOT EXISTS idx_discount_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_active ON discount_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_discount_valid_dates ON discount_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_discount_current_uses ON discount_codes(current_uses);

COMMENT ON TABLE discount_codes IS 'Promo/discount codes with validation rules and usage tracking';
COMMENT ON COLUMN discount_codes.type IS 'Discount type: percentage (e.g., 10 for 10% off) or fixed_amount (e.g., 100 for ₹100 off)';
COMMENT ON COLUMN discount_codes.value IS 'Discount value: percentage (0-100) or fixed amount in rupees';
COMMENT ON COLUMN discount_codes.max_uses IS 'Maximum number of times this code can be used across all orders (NULL = unlimited)';
COMMENT ON COLUMN discount_codes.current_uses IS 'Number of times this code has been used';
COMMENT ON COLUMN discount_codes.min_order_amount IS 'Minimum order subtotal required to use this code';
COMMENT ON COLUMN discount_codes.metadata IS 'Additional data (e.g., {\"source\": \"newsletter\", \"campaign\": \"winter2025\"})';

-- Order Discounts Junction Table
-- Tracks which discount codes were applied to which orders
CREATE TABLE IF NOT EXISTS order_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE RESTRICT,
  amount_saved DECIMAL(10, 2) NOT NULL CHECK (amount_saved >= 0),
  applied_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_order_discount UNIQUE(order_id, discount_code_id)
);

CREATE INDEX IF NOT EXISTS idx_order_discounts_order_id ON order_discounts(order_id);
CREATE INDEX IF NOT EXISTS idx_order_discounts_code_id ON order_discounts(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_order_discounts_applied_at ON order_discounts(applied_at DESC);

COMMENT ON TABLE order_discounts IS 'Junction table tracking discount codes applied to orders';
COMMENT ON COLUMN order_discounts.amount_saved IS 'Actual rupee amount saved by applying this discount';

-- Update orders table with discount columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount'));

CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON orders(discount_code) WHERE discount_code IS NOT NULL;

COMMENT ON COLUMN orders.discount_code IS 'Discount code applied to this order (denormalized for quick access)';
COMMENT ON COLUMN orders.discount_amount IS 'Total discount amount applied to order in rupees';
COMMENT ON COLUMN orders.discount_type IS 'Type of discount applied';

-- Update user_profiles table with newsletter tracking
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS newsletter_discount_code TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_newsletter ON user_profiles(newsletter_subscribed) WHERE newsletter_subscribed = true;

COMMENT ON COLUMN user_profiles.newsletter_subscribed IS 'True if user has subscribed to the newsletter';
COMMENT ON COLUMN user_profiles.newsletter_discount_code IS 'Discount code assigned when user subscribed to newsletter';

-- ============================================
-- DISCOUNT CODE FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Increment discount code usage when applied to order
CREATE OR REPLACE FUNCTION public.increment_discount_usage()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.discount_codes
  SET current_uses = current_uses + 1,
      updated_at = pg_catalog.now()
  WHERE id = NEW.discount_code_id;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.increment_discount_usage() IS 'Increments discount code usage counter when applied to an order';

-- Trigger: Increment usage on order discount insert
DROP TRIGGER IF EXISTS trigger_increment_discount_usage ON order_discounts;
CREATE TRIGGER trigger_increment_discount_usage
  AFTER INSERT ON order_discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_discount_usage();

-- Trigger: Update updated_at for discount_codes
DROP TRIGGER IF EXISTS update_discount_codes_updated_at ON discount_codes;
CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY FOR NEWSLETTER & DISCOUNTS
-- ============================================

-- Enable RLS on new tables
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_discounts ENABLE ROW LEVEL SECURITY;

-- NEWSLETTER_SUBSCRIBERS policies
DROP POLICY IF EXISTS "Anyone can insert newsletter subscription" ON newsletter_subscribers;
CREATE POLICY "Anyone can insert newsletter subscription"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to newsletter" ON newsletter_subscribers;
CREATE POLICY "Service role full access to newsletter"
  ON newsletter_subscribers FOR ALL
  USING ((SELECT auth.jwt()) ->> 'role' = 'service_role');

-- DISCOUNT_CODES policies
DROP POLICY IF EXISTS "Anyone can read active discount codes" ON discount_codes;
CREATE POLICY "Anyone can read active discount codes"
  ON discount_codes FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

DROP POLICY IF EXISTS "Service role full access to discount codes" ON discount_codes;
CREATE POLICY "Service role full access to discount codes"
  ON discount_codes FOR ALL
  USING ((SELECT auth.jwt()) ->> 'role' = 'service_role');

-- ORDER_DISCOUNTS policies
DROP POLICY IF EXISTS "Users can view discounts for their orders" ON order_discounts;
CREATE POLICY "Users can view discounts for their orders"
  ON order_discounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_discounts.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role full access to order discounts" ON order_discounts;
CREATE POLICY "Service role full access to order discounts"
  ON order_discounts FOR ALL
  USING ((SELECT auth.jwt()) ->> 'role' = 'service_role');

-- ============================================
-- FINAL COMMENTS
-- ============================================

COMMENT ON TABLE user_profiles IS 'Extended user profile information including phone number for order placement. RLS policies optimized for performance.';
COMMENT ON TABLE user_addresses IS 'User delivery addresses for quick checkout. RLS policies optimized for performance.';
COMMENT ON TABLE orders IS 'Customer orders with payment tracking. RLS policies optimized for performance.';
COMMENT ON TABLE order_items IS 'Line items for orders. RLS policies allow users to view items from their own orders.';

-- ============================================
-- CHARACTER CUSTOMIZER CATEGORIES & LAYERING
-- ============================================

-- Insert 6 new clothing categories for the character customizer
INSERT INTO categories (name, slug, description, is_active, created_at, updated_at)
VALUES
('Head', 'head', 'Hats, headbands, caps, and head accessories', true, NOW(), NOW()),
('Inner Tops', 'inner-tops', 'T-shirts, tank tops, base layers, and inner wear', true, NOW(), NOW()),
('Outer Tops', 'outer-tops', 'Hoodies, jackets, sweaters, and outerwear', true, NOW(), NOW()),
('Bottoms', 'bottoms', 'Pants, shorts, skirts, and legwear', true, NOW(), NOW()),
('Shoes', 'shoes', 'Sneakers, boots, sandals, and footwear', true, NOW(), NOW()),
('Accessories', 'accessories', 'Bags, jewelry, watches, and other accessories', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Add layering support fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_layerable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS layer_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS layer_position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb;

-- Add helpful comments
COMMENT ON COLUMN products.is_layerable IS 'Whether product can be used in character customizer';
COMMENT ON COLUMN products.layer_order IS 'Z-index order for layering (higher = on top)';
COMMENT ON COLUMN products.layer_position IS 'X/Y offset for layer alignment in customizer';

-- Create index for faster customizer queries
CREATE INDEX IF NOT EXISTS idx_products_layerable ON products(is_layerable) WHERE is_layerable = true;
CREATE INDEX IF NOT EXISTS idx_products_layer_order ON products(layer_order);

-- ============================================
-- QIKINK SKU CATALOG
-- ============================================
-- Stores all Qikink product SKUs for variant-specific order fulfillment

-- Create table to store Qikink product catalog with variant-specific SKUs
CREATE TABLE IF NOT EXISTS public.qikink_products (
  id SERIAL PRIMARY KEY,
  qikink_sku TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL, -- e.g., "V Neck T-Shirt", "Crop Hoodie"
  gender TEXT NOT NULL, -- M, F, B (Baby/Kids), U (Unisex)
  style_code TEXT NOT NULL, -- e.g., "VnHs", "CpHd", "RnFs"
  color_code TEXT NOT NULL, -- e.g., "Rd", "Bk", "Wh", "Nb"
  color_name TEXT NOT NULL, -- e.g., "Red", "Black", "White", "Navy Blue"
  size TEXT NOT NULL, -- S, M, L, XL, XXL, 3XL, 4XL, or age ranges for kids
  base_price DECIMAL(10,2), -- Optional: store base price from Qikink
  metadata JSONB, -- Optional: additional product info (material, weight, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast lookups during order processing
CREATE INDEX IF NOT EXISTS idx_qikink_products_lookup
  ON public.qikink_products(product_type, color_name, size);

CREATE INDEX IF NOT EXISTS idx_qikink_products_gender
  ON public.qikink_products(gender);

CREATE INDEX IF NOT EXISTS idx_qikink_products_style
  ON public.qikink_products(style_code);

-- Add column to products table for linking to Qikink product type
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS qikink_product_type TEXT,
ADD COLUMN IF NOT EXISTS qikink_gender TEXT;

-- Add helpful comments
COMMENT ON TABLE public.qikink_products IS 'Catalog of Qikink products with variant-specific SKUs for order fulfillment';
COMMENT ON COLUMN public.qikink_products.qikink_sku IS 'Unique Qikink SKU in format: {Gender}{Style}-{Color}-{Size}, e.g., MVnHs-Rd-L';
COMMENT ON COLUMN public.qikink_products.style_code IS 'Qikink style abbreviation extracted from SKU, e.g., VnHs=V Neck, CpHd=Crop Hoodie';
COMMENT ON COLUMN public.qikink_products.color_code IS 'Qikink color abbreviation from SKU, e.g., Rd=Red, Bk=Black';
COMMENT ON COLUMN public.products.qikink_product_type IS 'Maps to qikink_products.product_type for SKU lookup';
COMMENT ON COLUMN public.products.qikink_gender IS 'Maps to qikink_products.gender for SKU lookup';

-- Enable RLS for security
ALTER TABLE public.qikink_products ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for order processing)
DROP POLICY IF EXISTS "Allow public read access to qikink_products" ON public.qikink_products;
CREATE POLICY "Allow public read access to qikink_products"
  ON public.qikink_products
  FOR SELECT
  USING (true);

-- Only allow service role to modify
DROP POLICY IF EXISTS "Allow service role to manage qikink_products" ON public.qikink_products;
CREATE POLICY "Allow service role to manage qikink_products"
  ON public.qikink_products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger: Update updated_at for qikink_products
DROP TRIGGER IF EXISTS update_qikink_products_updated_at ON public.qikink_products;
CREATE TRIGGER update_qikink_products_updated_at
  BEFORE UPDATE ON public.qikink_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This consolidated schema includes:
-- - Core tables (try_on_usage, user_profiles, user_addresses, custom_requests with image URLs)
-- - Newsletter & Discount system (newsletter_subscribers, discount_codes, order_discounts)
-- - Character Customizer (layerable products, clothing categories)
-- - Qikink Print-on-Demand Integration (order forwarding, error tracking, SKU catalog)
-- - Qikink SKU Catalog (qikink_products table with 2,668 variants across 132 product types)
-- - Schema modifications (orders with user_id, Qikink fields, and discount fields, categories.is_active, products.featured, products detail fields, order_items variants, user_profiles newsletter tracking, products.qikink_product_type and qikink_gender)
-- - Security functions (hardened with search_path)
-- - Automated triggers (updated_at, order numbers, first purchase tracking, discount usage increment)
-- - Row Level Security policies (optimized for performance)
-- - Comprehensive indexes and comments
-- ============================================
