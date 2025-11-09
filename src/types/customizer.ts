import { Product } from '@/lib/supabase'
import { AmazonProduct } from './amazon'

// Category slugs for character customizer
export type CustomizerCategory = 'head' | 'inner-tops' | 'outer-tops' | 'bottoms' | 'shoes' | 'accessories'

// Layer order constants (higher = on top)
export const LAYER_ORDER = {
  BACKGROUND: 0,
  SHOES: 10,
  BOTTOMS: 20,
  INNER_TOPS: 30,
  OUTER_TOPS: 40,
  ACCESSORIES: 50,
  HEAD: 60,
} as const

// Unified product type for customizer (can be store product or affiliate)
export interface CustomizerProduct {
  id: string
  name: string
  category: CustomizerCategory
  images: string[]
  price?: number
  source: 'store' | 'affiliate'
  layerOrder: number
  layerPosition?: { x: number; y: number }
  // Store product fields
  storeProduct?: Product
  // Affiliate product fields
  affiliateProduct?: AmazonProduct
  affiliateLink?: string
}

// Selected variant info for outfit slot
export interface OutfitSlotVariant {
  colorId?: string
  colorName?: string
  colorHex?: string
  size?: string
  selectedImage?: string // Specific image for this variant
}

// Single outfit slot (can be empty)
export interface OutfitSlot {
  product: CustomizerProduct | null
  variant?: OutfitSlotVariant
}

// Complete character outfit state
export interface CharacterOutfit {
  head: OutfitSlot
  innerTops: OutfitSlot
  outerTops: OutfitSlot
  bottoms: OutfitSlot
  shoes: OutfitSlot
  accessories: OutfitSlot[]
}

// Helper type for slot keys
export type OutfitSlotKey = keyof Omit<CharacterOutfit, 'accessories'>

// Helper to check if slot is empty
export function isSlotEmpty(slot: OutfitSlot): boolean {
  return slot.product === null
}

// Helper to get active category products
export function filterProductsByCategory(
  products: CustomizerProduct[],
  category: CustomizerCategory
): CustomizerProduct[] {
  return products.filter(p => p.category === category)
}
