import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Product } from '@/lib/supabase'

export interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

interface UseProductsParams {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  tags?: string[]
  limit?: number
}

export const useProducts = (params: UseProductsParams = {}) => {
  const { category, minPrice, maxPrice, inStock, tags, limit = 20 } = params

  return useInfiniteQuery<ProductsResponse>({
    queryKey: ['products', params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        page: String(pageParam),
        limit: String(limit),
      })

      if (category) searchParams.set('category', category)
      if (minPrice !== undefined) searchParams.set('minPrice', String(minPrice))
      if (maxPrice !== undefined) searchParams.set('maxPrice', String(maxPrice))
      if (inStock) searchParams.set('inStock', 'true')
      if (tags && tags.length > 0) searchParams.set('tags', tags.join(','))

      const response = await fetch(`/api/products?${searchParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      return response.json()
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  })
}

export const useProductsByCategory = (categoryId: string) => {
  return useQuery<Product[]>({
    queryKey: ['products', 'category', categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/products?category=${categoryId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products by category')
      }
      return response.json()
    },
    enabled: !!categoryId,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}