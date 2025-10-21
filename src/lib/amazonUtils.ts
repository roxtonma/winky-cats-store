import { AmazonProduct } from '@/types/amazon'

/**
 * Extracts ASIN from any Amazon product URL
 * Supports various Amazon URL formats including amazon.com, amazon.in, etc.
 * @param url - Amazon product URL
 * @returns ASIN or null if not found
 */
export function extractAsinFromUrl(url: string): string | null {
  try {
    // Pattern 1: /dp/ASIN
    const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
    if (dpMatch) return dpMatch[1]

    // Pattern 2: /gp/product/ASIN
    const gpMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/)
    if (gpMatch) return gpMatch[1]

    // Pattern 3: /product/ASIN
    const productMatch = url.match(/\/product\/([A-Z0-9]{10})/)
    if (productMatch) return productMatch[1]

    // Pattern 4: ASIN in query params
    const searchParams = new URL(url).searchParams
    const asinParam = searchParams.get('ASIN')
    if (asinParam) return asinParam

    return null
  } catch (error) {
    console.error('Error extracting ASIN from URL:', error)
    return null
  }
}

/**
 * Detects Amazon marketplace from URL
 * @param url - Amazon product URL
 * @returns Domain (e.g., 'amazon.com', 'amazon.in')
 */
export function detectAmazonMarketplace(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    if (hostname.includes('amazon.in')) return 'amazon.in'
    if (hostname.includes('amazon.co.uk')) return 'amazon.co.uk'
    if (hostname.includes('amazon.ca')) return 'amazon.ca'
    if (hostname.includes('amazon.de')) return 'amazon.de'
    if (hostname.includes('amazon.fr')) return 'amazon.fr'
    if (hostname.includes('amazon.es')) return 'amazon.es'
    if (hostname.includes('amazon.it')) return 'amazon.it'
    if (hostname.includes('amazon.co.jp')) return 'amazon.co.jp'

    // Default to .com
    return 'amazon.com'
  } catch {
    return 'amazon.com'
  }
}

/**
 * Generates a unique link ID for tracking individual affiliate links
 * Format matches Amazon's linkId pattern (32-character hex string)
 * @param asin - Amazon Standard Identification Number
 * @param associateId - Your Amazon Associate ID
 * @returns Unique link identifier
 */
function generateLinkId(asin: string, associateId: string): string {
  // Create a deterministic but unique ID based on ASIN and associate ID
  const combined = `${asin}-${associateId}-${Date.now()}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  // Convert to hex and pad to 32 characters
  return Math.abs(hash).toString(16).padStart(32, '0')
}

/**
 * Gets the language code for a given marketplace
 * @param marketplace - Amazon marketplace domain
 * @returns Language code (e.g., 'en_US', 'en_IN')
 */
function getMarketplaceLanguage(marketplace: string): string {
  const languageMap: Record<string, string> = {
    'amazon.in': 'en_IN',
    'amazon.co.uk': 'en_GB',
    'amazon.ca': 'en_CA',
    'amazon.com.au': 'en_AU',
    'amazon.de': 'de_DE',
    'amazon.fr': 'fr_FR',
    'amazon.es': 'es_ES',
    'amazon.it': 'it_IT',
    'amazon.co.jp': 'ja_JP',
    'amazon.com': 'en_US',
  }
  return languageMap[marketplace] || 'en_US'
}

/**
 * Builds an Amazon affiliate link with enhanced tracking parameters
 * @param asin - Amazon Standard Identification Number
 * @param associateId - Your Amazon Associate ID
 * @param marketplace - Amazon marketplace domain (default: amazon.com)
 * @returns Full affiliate link with tracking parameters
 */
export function buildAffiliateLink(
  asin: string,
  associateId: string,
  marketplace: string = 'amazon.com'
): string {
  const linkId = generateLinkId(asin, associateId)
  const language = getMarketplaceLanguage(marketplace)

  const params = new URLSearchParams({
    th: '1',                    // Show product variations
    linkCode: 'll1',            // Link type: text link
    tag: associateId,           // Your affiliate tag (required for commissions)
    linkId: linkId,             // Unique identifier for detailed tracking
    language: language,         // Language preference
    ref_: 'as_li_ss_tl'        // Referrer: SiteStripe text link
  })

  return `https://www.${marketplace}/dp/${asin}?${params.toString()}`
}

/**
 * Enhances products with dynamically generated affiliate links
 * @param products - Array of Amazon products
 * @param associateId - Your Amazon Associate ID
 * @returns Products with updated affiliate links
 */
export function enhanceProductsWithAffiliateLinks(
  products: AmazonProduct[],
  associateId: string
): AmazonProduct[] {
  return products.map(product => ({
    ...product,
    affiliateLink: buildAffiliateLink(
      product.asin,
      associateId,
      product.marketplace || 'amazon.com'
    )
  }))
}

/**
 * Processes an Amazon URL and returns extracted data
 * Useful for easily adding products by just pasting an Amazon link
 * @param url - Amazon product URL
 * @returns Object with ASIN and marketplace, or null if extraction fails
 */
export function processAmazonUrl(url: string): { asin: string; marketplace: string } | null {
  const asin = extractAsinFromUrl(url)
  if (!asin) return null

  const marketplace = detectAmazonMarketplace(url)
  return { asin, marketplace }
}
