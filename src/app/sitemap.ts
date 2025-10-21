import { MetadataRoute } from 'next'
import amazonData from '@/data/amazonProducts.json'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use environment variable for site URL, fallback to Vercel auto-detected URL
  // Set NEXT_PUBLIC_SITE_URL in Vercel environment variables when you have a custom domain
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://winky-cats-store.vercel.app'

  // Static pages
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/associates`,
      lastModified: new Date(amazonData.lastUpdated),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  return routes
}
