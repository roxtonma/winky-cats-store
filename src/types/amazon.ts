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
  estimatedPrice?: string // Optional, as Amazon prices change frequently
  tags?: string[] // For filtering/categorization
  marketplace?: string // Amazon marketplace domain (e.g., 'amazon.in', 'amazon.com')
}

export interface AmazonProductsData {
  products: AmazonProduct[]
  lastUpdated: string
  associateId: string // Your Amazon Associate ID (for reference)
}

// Category type for filtering - can be any string
export type AmazonProductCategory = string
