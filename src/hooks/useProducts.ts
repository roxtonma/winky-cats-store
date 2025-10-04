import { useQuery } from '@tanstack/react-query'
import { Product } from '@/lib/supabase'

export const useProducts = (apiUrl: string = '/api/products') => {
  return useQuery<Product[]>({
    queryKey: ['products', apiUrl],
    queryFn: async () => {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      return response.json()
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