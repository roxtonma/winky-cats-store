// Amazon Associates product types
// Structured to allow easy migration to Amazon Product Advertising API later

export interface AmazonProduct {
  id: string
  asin: string // Amazon Standard Identification Number
  name: string
  description: string
  category: string
  images: string[] // Product images for carousel display (at least one required)
  affiliateLink: string // Full Amazon Associates tracking link (can be empty, will be generated)
  price?: number // Current price (numeric value, will use default currency)
  originalPrice?: number // MRP/original price for discount calculation
  currency?: string // Currency override (defaults to defaultCurrency from data file)
  estimatedPrice?: string // @deprecated - Use price instead. Kept for backward compatibility
  tags?: string[] // For filtering/categorization
  marketplace?: string // Amazon marketplace domain (e.g., 'amazon.in', 'amazon.com')
  featured?: boolean // If true, this product appears first in "Featured" sort
}

export interface AmazonProductsData {
  products: AmazonProduct[]
  lastUpdated: string
  associateId: string // Your Amazon Associate ID (for reference)
  defaultCurrency?: string // Default currency symbol (e.g., '₹', '$', '€')
  defaultMarketplace?: string // Default Amazon marketplace (e.g., 'amazon.in', 'amazon.com')
}

// Category type for filtering - can be any string
export type AmazonProductCategory = string
