/**
 * Admin API endpoint for Qikink SKU management
 *
 * Endpoints:
 * - GET: Search and browse available Qikink SKUs
 * - POST: Test SKU mapping for a specific product variant
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  searchQikinkProducts,
  getQikinkSKU,
  getAvailableProductTypes,
  getAvailableColors,
  getAvailableSizes,
  getCacheStats
} from '@/lib/qikinkSkuMapper'

/**
 * GET /api/admin/qikink-skus
 *
 * Query params:
 * - action: "search" | "product-types" | "colors" | "sizes" | "cache-stats"
 * - productType: Product type filter (for search/colors/sizes)
 * - colorName: Color filter (for search/sizes)
 * - size: Size filter (for search)
 * - gender: Gender filter (for search/colors/sizes)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'search'

    switch (action) {
      case 'product-types': {
        const productTypes = await getAvailableProductTypes()
        return NextResponse.json({
          success: true,
          data: productTypes,
          count: productTypes.length
        })
      }

      case 'colors': {
        const productType = searchParams.get('productType')
        const gender = searchParams.get('gender') || undefined

        if (!productType) {
          return NextResponse.json(
            { error: 'productType is required for colors action' },
            { status: 400 }
          )
        }

        const colors = await getAvailableColors(productType, gender)
        return NextResponse.json({
          success: true,
          data: colors,
          count: colors.length,
          filters: { productType, gender }
        })
      }

      case 'sizes': {
        const productType = searchParams.get('productType')
        const colorName = searchParams.get('colorName') || undefined
        const gender = searchParams.get('gender') || undefined

        if (!productType) {
          return NextResponse.json(
            { error: 'productType is required for sizes action' },
            { status: 400 }
          )
        }

        const sizes = await getAvailableSizes(productType, colorName, gender)
        return NextResponse.json({
          success: true,
          data: sizes,
          count: sizes.length,
          filters: { productType, colorName, gender }
        })
      }

      case 'cache-stats': {
        const stats = getCacheStats()
        return NextResponse.json({
          success: true,
          data: stats
        })
      }

      case 'search':
      default: {
        const productType = searchParams.get('productType') || undefined
        const colorName = searchParams.get('colorName') || undefined
        const size = searchParams.get('size') || undefined
        const gender = searchParams.get('gender') || undefined

        const products = await searchQikinkProducts({
          productType,
          colorName,
          size,
          gender
        })

        return NextResponse.json({
          success: true,
          data: products,
          count: products.length,
          filters: { productType, colorName, size, gender }
        })
      }
    }
  } catch (error) {
    console.error('Error in GET /api/admin/qikink-skus:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Qikink SKUs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/qikink-skus
 *
 * Test SKU mapping for a product variant
 *
 * Body:
 * {
 *   "productType": "V Neck T-Shirt",
 *   "colorName": "Red",
 *   "size": "L",
 *   "gender": "Male" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productType, colorName, size, gender } = body

    // Validate required fields
    if (!productType || !colorName || !size) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['productType', 'colorName', 'size']
        },
        { status: 400 }
      )
    }

    // Test SKU lookup
    const startTime = Date.now()
    const qikinkSku = await getQikinkSKU({
      productType,
      colorName,
      size,
      gender
    })
    const lookupTime = Date.now() - startTime

    if (qikinkSku) {
      return NextResponse.json({
        success: true,
        found: true,
        data: {
          qikinkSku,
          input: { productType, colorName, size, gender },
          lookupTimeMs: lookupTime
        }
      })
    } else {
      // SKU not found - provide helpful suggestions
      const suggestions: string[] = []

      // Get available colors for this product type
      const availableColors = await getAvailableColors(productType, gender)
      if (availableColors.length > 0) {
        suggestions.push(`Available colors: ${availableColors.slice(0, 10).join(', ')}${availableColors.length > 10 ? '...' : ''}`)
      }

      // Get available sizes for this product type and color
      const availableSizes = await getAvailableSizes(productType, colorName, gender)
      if (availableSizes.length > 0) {
        suggestions.push(`Available sizes for ${colorName}: ${availableSizes.join(', ')}`)
      }

      return NextResponse.json({
        success: true,
        found: false,
        data: {
          qikinkSku: null,
          input: { productType, colorName, size, gender },
          lookupTimeMs: lookupTime,
          suggestions
        }
      })
    }
  } catch (error) {
    console.error('Error in POST /api/admin/qikink-skus:', error)
    return NextResponse.json(
      {
        error: 'Failed to test SKU mapping',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
