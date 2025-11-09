import { supabase, Product } from './supabase'
import { AmazonProduct } from '@/types/amazon'
import { CustomizerProduct, CustomizerCategory, LAYER_ORDER } from '@/types/customizer'

// Map category slugs to layer orders
const categoryLayerOrders: Record<CustomizerCategory, number> = {
  'head': LAYER_ORDER.HEAD,
  'inner-tops': LAYER_ORDER.INNER_TOPS,
  'outer-tops': LAYER_ORDER.OUTER_TOPS,
  'bottoms': LAYER_ORDER.BOTTOMS,
  'shoes': LAYER_ORDER.SHOES,
  'accessories': LAYER_ORDER.ACCESSORIES,
}

/**
 * Convert Supabase product to CustomizerProduct
 */
function productToCustomizerProduct(product: Product): CustomizerProduct | null {
  if (!product.category?.slug || !product.is_layerable) return null

  const category = product.category.slug as CustomizerCategory
  if (!categoryLayerOrders[category]) return null

  return {
    id: product.id,
    name: product.name,
    category,
    images: product.images || [],
    price: product.price,
    source: 'store',
    layerOrder: product.layer_order || categoryLayerOrders[category],
    layerPosition: product.layer_position,
    storeProduct: product,
  }
}

/**
 * Convert Amazon product to CustomizerProduct
 */
function amazonToCustomizerProduct(amazon: AmazonProduct): CustomizerProduct | null {
  if (!amazon.isLayerable) return null

  // Map Amazon category to CustomizerCategory
  const categoryMap: Record<string, CustomizerCategory> = {
    'head': 'head',
    'hats': 'head',
    'caps': 'head',
    'inner-tops': 'inner-tops',
    't-shirts': 'inner-tops',
    'shirts': 'inner-tops',
    'outer-tops': 'outer-tops',
    'hoodies': 'outer-tops',
    'jackets': 'outer-tops',
    'bottoms': 'bottoms',
    'pants': 'bottoms',
    'jeans': 'bottoms',
    'shorts': 'bottoms',
    'shoes': 'shoes',
    'sneakers': 'shoes',
    'boots': 'shoes',
    'accessories': 'accessories',
    'bags': 'accessories',
    'watches': 'accessories',
  }

  const category = categoryMap[amazon.category.toLowerCase()]
  if (!category) return null

  return {
    id: amazon.id,
    name: amazon.name,
    category,
    images: amazon.images,
    price: amazon.price,
    source: 'affiliate',
    layerOrder: amazon.layerOrder || categoryLayerOrders[category],
    layerPosition: amazon.layerPosition,
    affiliateProduct: amazon,
    affiliateLink: amazon.affiliateLink,
  }
}

/**
 * Fetch products from Supabase for a specific category
 */
async function fetchStoreProducts(category: CustomizerCategory): Promise<CustomizerProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('is_layerable', true)
      .eq('categories.slug', category)

    if (error) throw error

    return (data || [])
      .map(productToCustomizerProduct)
      .filter((p): p is CustomizerProduct => p !== null)
  } catch (error) {
    console.error('Error fetching store products:', error)
    return []
  }
}

/**
 * Fetch Amazon affiliate products for a specific category
 */
async function fetchAmazonProducts(category: CustomizerCategory): Promise<CustomizerProduct[]> {
  try {
    // Import the Amazon products data
    const amazonData = await import('@/data/amazonProducts.json')
    const products = amazonData.products || []

    return products
      .map(amazonToCustomizerProduct)
      .filter((p): p is CustomizerProduct => p !== null && p.category === category)
  } catch (error) {
    console.error('Error fetching Amazon products:', error)
    return []
  }
}

/**
 * Fetch all products for a category (store + Amazon)
 */
export async function fetchCustomizerProducts(category: CustomizerCategory): Promise<CustomizerProduct[]> {
  const [storeProducts, amazonProducts] = await Promise.all([
    fetchStoreProducts(category),
    fetchAmazonProducts(category),
  ])

  // Combine and sort by source (store first) and price
  return [...storeProducts, ...amazonProducts].sort((a, b) => {
    if (a.source !== b.source) {
      return a.source === 'store' ? -1 : 1
    }
    return (a.price || 0) - (b.price || 0)
  })
}

/**
 * Fetch all available categories that have layerable products
 */
export async function fetchAvailableCategories(): Promise<CustomizerCategory[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('slug')
      .eq('is_active', true)
      .in('slug', [
        'head',
        'inner-tops',
        'outer-tops',
        'bottoms',
        'shoes',
        'accessories',
      ])

    if (error) throw error

    return (data || []).map(cat => cat.slug as CustomizerCategory)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}
