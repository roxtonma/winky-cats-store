import { useQuery } from '@tanstack/react-query'
import { Category } from '@/lib/supabase'

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      return response.json()
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (categories change less frequently)
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}