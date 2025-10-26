-- ============================================
-- ADD VARIANT TRACKING TO ORDER ITEMS
-- ============================================
-- This migration adds variant information (size, color, image) to order items
-- so that orders correctly display the specific product variant that was ordered
-- Date: 2025-01-XX
-- ============================================

-- Add variant columns to order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variant_size TEXT,
ADD COLUMN IF NOT EXISTS variant_color TEXT,
ADD COLUMN IF NOT EXISTS variant_color_name TEXT,
ADD COLUMN IF NOT EXISTS variant_image TEXT;

-- Add comments
COMMENT ON COLUMN order_items.variant_size IS 'Size variant selected (e.g., S, M, L, XL)';
COMMENT ON COLUMN order_items.variant_color IS 'Color hex value of selected variant';
COMMENT ON COLUMN order_items.variant_color_name IS 'Human-readable color name (e.g., Red, Blue, Black)';
COMMENT ON COLUMN order_items.variant_image IS 'Image URL for the specific variant ordered';

-- Add index for variant queries (optional, for future features like filtering by color/size)
CREATE INDEX IF NOT EXISTS idx_order_items_variant_color_name ON order_items(variant_color_name);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_size ON order_items(variant_size);

-- ============================================
-- Summary
-- ============================================
-- Order items now track:
-- - variant_size: The size selected (if applicable)
-- - variant_color: Hex color code (if applicable)
-- - variant_color_name: Display name for color (e.g., "Red", "Blue")
-- - variant_image: Specific image URL for the variant
--
-- This allows the order history to show:
-- "Red Hoodie - Large" with the red hoodie image
-- instead of just "Hoodie" with the default image
