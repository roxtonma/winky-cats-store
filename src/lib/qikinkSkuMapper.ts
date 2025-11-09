/**
 * Qikink SKU Mapper
 *
 * Maps product variants (type, color, size) to Qikink-specific SKUs.
 * Includes caching for performance optimization.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QikinkProduct {
  qikink_sku: string;
  product_type: string;
  gender: string;
  style_code: string;
  color_code: string;
  color_name: string;
  size: string;
  base_price: number;
  metadata?: {
    shipping_weight?: number;
    tax_rate?: number;
    description?: string;
  };
}

interface SKULookupParams {
  productType: string;
  colorName: string;
  size: string;
  gender?: string; // Optional: helps narrow down results
}

interface SKUSearchParams {
  productType?: string;
  colorName?: string;
  size?: string;
  gender?: string;
}

// In-memory cache for SKU lookups
class SKUCache {
  private cache: Map<string, QikinkProduct | null>;
  private ttl: number = 5 * 60 * 1000; // 5 minutes
  private timestamps: Map<string, number>;

  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  private generateKey(params: SKULookupParams): string {
    return `${params.productType}|${params.colorName}|${params.size}|${params.gender || ''}`.toLowerCase();
  }

  get(params: SKULookupParams): QikinkProduct | null | undefined {
    const key = this.generateKey(params);
    const timestamp = this.timestamps.get(key);

    // Check if cache entry exists and is not expired
    if (timestamp && Date.now() - timestamp < this.ttl) {
      return this.cache.get(key);
    }

    // Entry expired or doesn't exist
    this.cache.delete(key);
    this.timestamps.delete(key);
    return undefined;
  }

  set(params: SKULookupParams, product: QikinkProduct | null): void {
    const key = this.generateKey(params);
    this.cache.set(key, product);
    this.timestamps.set(key, Date.now());
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const skuCache = new SKUCache();

/**
 * Get Qikink SKU for a product variant
 *
 * @param params - Product variant parameters
 * @returns Qikink SKU string or null if not found
 */
export async function getQikinkSKU(params: SKULookupParams): Promise<string | null> {
  // Check cache first
  const cachedProduct = skuCache.get(params);
  if (cachedProduct !== undefined) {
    return cachedProduct?.qikink_sku || null;
  }

  // Query database
  try {
    let query = supabase
      .from('qikink_products')
      .select('qikink_sku, product_type, gender, color_name, size')
      .eq('product_type', params.productType)
      .eq('size', params.size);

    // Try exact color match first
    query = query.ilike('color_name', params.colorName);

    // Optionally filter by gender
    if (params.gender) {
      query = query.eq('gender', params.gender);
    }

    const { data, error } = await query.limit(1).single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching Qikink SKU:', error);
      return null;
    }

    const result = data as QikinkProduct | null;

    // Cache the result (even if null)
    skuCache.set(params, result);

    return result?.qikink_sku || null;
  } catch (error) {
    console.error('Exception in getQikinkSKU:', error);
    return null;
  }
}

/**
 * Get full Qikink product details
 *
 * @param params - Product variant parameters
 * @returns Full product details or null if not found
 */
export async function getQikinkProduct(params: SKULookupParams): Promise<QikinkProduct | null> {
  // Check cache first
  const cachedProduct = skuCache.get(params);
  if (cachedProduct !== undefined) {
    return cachedProduct;
  }

  // Query database
  try {
    let query = supabase
      .from('qikink_products')
      .select('*')
      .eq('product_type', params.productType)
      .eq('size', params.size);

    // Try exact color match first
    query = query.ilike('color_name', params.colorName);

    // Optionally filter by gender
    if (params.gender) {
      query = query.eq('gender', params.gender);
    }

    const { data, error } = await query.limit(1).single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Qikink product:', error);
      return null;
    }

    const result = data as QikinkProduct | null;

    // Cache the result
    skuCache.set(params, result);

    return result;
  } catch (error) {
    console.error('Exception in getQikinkProduct:', error);
    return null;
  }
}

/**
 * Search for available Qikink products
 *
 * @param params - Search parameters (all optional)
 * @returns Array of matching products
 */
export async function searchQikinkProducts(params: SKUSearchParams = {}): Promise<QikinkProduct[]> {
  try {
    let query = supabase.from('qikink_products').select('*');

    if (params.productType) {
      query = query.eq('product_type', params.productType);
    }

    if (params.colorName) {
      query = query.ilike('color_name', `%${params.colorName}%`);
    }

    if (params.size) {
      query = query.eq('size', params.size);
    }

    if (params.gender) {
      query = query.eq('gender', params.gender);
    }

    const { data, error } = await query.order('product_type').order('color_name').order('size');

    if (error) {
      console.error('Error searching Qikink products:', error);
      return [];
    }

    return (data as QikinkProduct[]) || [];
  } catch (error) {
    console.error('Exception in searchQikinkProducts:', error);
    return [];
  }
}

/**
 * Get all unique product types
 */
export async function getAvailableProductTypes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('qikink_products')
      .select('product_type')
      .order('product_type');

    if (error) {
      console.error('Error fetching product types:', error);
      return [];
    }

    // Get unique product types
    const uniqueTypes = Array.from(new Set((data || []).map((row: { product_type: string }) => row.product_type)));
    return uniqueTypes;
  } catch (error) {
    console.error('Exception in getAvailableProductTypes:', error);
    return [];
  }
}

/**
 * Get available colors for a product type
 */
export async function getAvailableColors(productType: string, gender?: string): Promise<string[]> {
  try {
    let query = supabase
      .from('qikink_products')
      .select('color_name')
      .eq('product_type', productType);

    if (gender) {
      query = query.eq('gender', gender);
    }

    const { data, error } = await query.order('color_name');

    if (error) {
      console.error('Error fetching colors:', error);
      return [];
    }

    // Get unique colors
    const uniqueColors = Array.from(new Set((data || []).map((row: { color_name: string }) => row.color_name)));
    return uniqueColors;
  } catch (error) {
    console.error('Exception in getAvailableColors:', error);
    return [];
  }
}

/**
 * Get available sizes for a product type and color
 */
export async function getAvailableSizes(
  productType: string,
  colorName?: string,
  gender?: string
): Promise<string[]> {
  try {
    let query = supabase
      .from('qikink_products')
      .select('size')
      .eq('product_type', productType);

    if (colorName) {
      query = query.eq('color_name', colorName);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }

    const { data, error } = await query.order('size');

    if (error) {
      console.error('Error fetching sizes:', error);
      return [];
    }

    // Get unique sizes
    const uniqueSizes = Array.from(new Set((data || []).map((row: { size: string }) => row.size)));
    return uniqueSizes;
  } catch (error) {
    console.error('Exception in getAvailableSizes:', error);
    return [];
  }
}

/**
 * Clear the SKU cache
 */
export function clearCache(): void {
  skuCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: skuCache.size(),
    enabled: true
  };
}

/**
 * Fuzzy match color names (handles variations like "Red" vs "Maroon")
 *
 * @param requestedColor - Color name from order
 * @param availableColors - Available colors in Qikink catalog
 * @returns Best matching color or null
 */
export function fuzzyMatchColor(requestedColor: string, availableColors: string[]): string | null {
  const normalized = requestedColor.toLowerCase().trim();

  // Exact match
  const exactMatch = availableColors.find(c => c.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;

  // Partial match
  const partialMatch = availableColors.find(c =>
    c.toLowerCase().includes(normalized) || normalized.includes(c.toLowerCase())
  );
  if (partialMatch) return partialMatch;

  // Color aliases
  const colorAliases: Record<string, string[]> = {
    'black': ['bk', 'blk'],
    'white': ['wh', 'wht'],
    'red': ['rd'],
    'blue': ['navy blue', 'royal blue', 'nb', 'rb'],
    'green': ['bottle green', 'olive green', 'gn', 'og'],
    'grey': ['gray', 'grey melange', 'charcoal melange', 'gm', 'cm'],
    'maroon': ['mn'],
    'lavender': ['lv']
  };

  // Check aliases
  for (const [baseColor, aliases] of Object.entries(colorAliases)) {
    if (normalized === baseColor || aliases.some(alias => normalized.includes(alias))) {
      const aliasMatch = availableColors.find(c =>
        c.toLowerCase().includes(baseColor) || aliases.some(alias => c.toLowerCase().includes(alias))
      );
      if (aliasMatch) return aliasMatch;
    }
  }

  return null;
}
