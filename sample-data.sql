-- Sample data for testing your Winky Store (Print-on-Demand)
-- Run this AFTER you've created your database schema

-- Insert sample categories
INSERT INTO categories (name, description, slug) VALUES
('T-Shirts', 'Custom printed t-shirts for every style', 't-shirts'),
('Hoodies', 'Cozy hoodies with custom designs', 'hoodies'),
('Accessories', 'Bags, mugs and other custom accessories', 'accessories');

-- Insert sample products with print-on-demand fields
INSERT INTO products (
  name, description, price, compare_at_price, sku, inventory_quantity,
  category_id, images, is_active, vendor, product_type, material,
  variants, tags
) VALUES
(
  'Custom Graphic T-Shirt',
  'High-quality cotton t-shirt with your custom design. Available in multiple sizes and colors.',
  499.00,
  599.00,
  'TSHIRT-001',
  999, -- POD typically has high inventory
  (SELECT id FROM categories WHERE slug = 't-shirts'),
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
  true,
  'qikink',
  't-shirt',
  'cotton',
  '{"sizes": ["S", "M", "L", "XL", "XXL"], "colors": ["white", "black", "navy", "red"], "price_variants": {"S": 499, "M": 499, "L": 529, "XL": 559, "XXL": 599}}',
  ARRAY['custom', 'casual', 'cotton']
),
(
  'Premium Hoodie',
  'Comfortable fleece hoodie perfect for casual wear. Custom printing available.',
  1299.00,
  NULL,
  'HOODIE-001',
  999,
  (SELECT id FROM categories WHERE slug = 'hoodies'),
  ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'],
  true,
  'qikink',
  'hoodie',
  'cotton-blend',
  '{"sizes": ["S", "M", "L", "XL", "XXL"], "colors": ["black", "grey", "navy"], "price_variants": {"S": 1299, "M": 1299, "L": 1329, "XL": 1359, "XXL": 1399}}',
  ARRAY['hoodie', 'warm', 'custom']
),
(
  'Custom Canvas Tote Bag',
  'Eco-friendly canvas tote bag with custom printing. Perfect for daily use.',
  399.00,
  499.00,
  'BAG-001',
  999,
  (SELECT id FROM categories WHERE slug = 'accessories'),
  ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
  true,
  'qikink',
  'tote-bag',
  'canvas',
  '{"colors": ["natural", "black"], "price_variants": {"natural": 399, "black": 429}}',
  ARRAY['eco-friendly', 'tote', 'custom']
),
(
  'Photo Print T-Shirt',
  'Personalized t-shirt with your photo or artwork. High-quality digital printing.',
  549.00,
  NULL,
  'TSHIRT-002',
  999,
  (SELECT id FROM categories WHERE slug = 't-shirts'),
  ARRAY['https://images.unsplash.com/photo-1503341960582-b45751874cf0?w=400'],
  true,
  'qikink',
  't-shirt',
  'cotton',
  '{"sizes": ["S", "M", "L", "XL"], "colors": ["white", "black"], "price_variants": {"S": 549, "M": 549, "L": 579, "XL": 609}}',
  ARRAY['photo-print', 'personalized', 'custom']
),
(
  'Designer Crop Top',
  'Trendy crop top with custom design printing. Perfect for casual outings.',
  449.00,
  529.00,
  'CROP-001',
  999,
  (SELECT id FROM categories WHERE slug = 't-shirts'),
  ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400'],
  true,
  'qikink',
  'crop-top',
  'cotton',
  '{"sizes": ["XS", "S", "M", "L", "XL"], "colors": ["white", "black", "pink"], "price_variants": {"XS": 449, "S": 449, "M": 459, "L": 479, "XL": 499}}',
  ARRAY['crop-top', 'trendy', 'custom']
);