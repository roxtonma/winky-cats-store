import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderAmount } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      )
    }

    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid order amount is required' },
        { status: 400 }
      )
    }

    // Fetch discount code from database
    const { data: discountCode, error: fetchError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single()

    if (fetchError || !discountCode) {
      return NextResponse.json(
        { error: 'Invalid discount code', valid: false },
        { status: 404 }
      )
    }

    // Validate discount code
    const now = new Date()
    const validFrom = discountCode.valid_from ? new Date(discountCode.valid_from) : null
    const validUntil = discountCode.valid_until ? new Date(discountCode.valid_until) : null

    // Check if code is active
    if (!discountCode.is_active) {
      return NextResponse.json(
        { error: 'This discount code is no longer active', valid: false },
        { status: 400 }
      )
    }

    // Check date validity
    if (validFrom && now < validFrom) {
      return NextResponse.json(
        { error: 'This discount code is not yet valid', valid: false },
        { status: 400 }
      )
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json(
        { error: 'This discount code has expired', valid: false },
        { status: 400 }
      )
    }

    // Check usage limits
    if (discountCode.max_uses !== null && discountCode.current_uses >= discountCode.max_uses) {
      return NextResponse.json(
        { error: 'This discount code has reached its usage limit', valid: false },
        { status: 400 }
      )
    }

    // Check minimum order amount
    if (discountCode.min_order_amount && orderAmount < parseFloat(discountCode.min_order_amount)) {
      return NextResponse.json(
        {
          error: `Minimum order amount of ₹${discountCode.min_order_amount} required`,
          valid: false
        },
        { status: 400 }
      )
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discountCode.type === 'percentage') {
      discountAmount = Math.round((orderAmount * parseFloat(discountCode.value)) / 100)
    } else if (discountCode.type === 'fixed_amount') {
      discountAmount = Math.min(parseFloat(discountCode.value), orderAmount)
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount)

    return NextResponse.json({
      valid: true,
      code: discountCode.code,
      type: discountCode.type,
      value: parseFloat(discountCode.value),
      discountAmount,
      description: discountCode.description || null,
      message: `Discount code applied! You save ₹${discountAmount}`
    })

  } catch (error) {
    console.error('Error validating discount code:', error)
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    )
  }
}
