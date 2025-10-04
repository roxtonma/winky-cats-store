import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categorySlug = searchParams.get('category')

    // Build query with category join
    let query = supabase
      .from('products')
      .select('*, category:categories(id, name, slug)')
      .eq('is_active', true)

    // Filter by category slug if provided
    if (categorySlug) {
      query = query.eq('categories.slug', categorySlug)
    }

    const { data: products, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // 1hr cache, 2hr stale
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}