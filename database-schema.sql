-- Ecommerce Database Schema for Supabase
-- Run these commands in your Supabase SQL editor

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (enhanced for print-on-demand integration)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2), -- for showing discounts
  sku VARCHAR(100) UNIQUE,
  inventory_quantity INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  images TEXT[], -- array of image URLs
  is_active BOOLEAN DEFAULT true,
  weight DECIMAL(8,2), -- for shipping calculations

  -- Print-on-demand specific fields
  vendor VARCHAR(100), -- e.g., 'qikink'
  vendor_product_id VARCHAR(100), -- Qikink's product ID
  product_type VARCHAR(100), -- t-shirt, hoodie, mug, etc.
  base_product_id VARCHAR(100), -- Base product in Qikink
  print_areas JSONB, -- printing locations/areas data
  design_url TEXT, -- URL to design file
  variants JSONB, -- size, color variants with pricing
  material VARCHAR(100), -- cotton, polyester, etc.
  brand VARCHAR(100), -- product brand
  tags TEXT[], -- product tags for filtering

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table (enhanced for print-on-demand integration)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB, -- store full address as JSON
  billing_address JSONB,
  notes TEXT,

  -- Print-on-demand specific fields
  vendor VARCHAR(100), -- e.g., 'qikink'
  vendor_order_id VARCHAR(100), -- Qikink's order ID
  vendor_status VARCHAR(100), -- Qikink's order status
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  shipping_partner VARCHAR(100), -- courier partner
  expected_delivery_date DATE,
  production_status VARCHAR(50), -- queued, printing, printed, shipped
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
  payment_method VARCHAR(50), -- card, upi, netbanking, etc.
  payment_reference VARCHAR(100), -- transaction ID

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables
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

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for categories and products
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);

-- Orders are private - only allow insert for new orders, no read access for now
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order items" ON order_items FOR INSERT WITH CHECK (true);