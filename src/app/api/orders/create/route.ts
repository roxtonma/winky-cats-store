import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Razorpay from 'razorpay'
import { CreateOrderRequest, CreateOrderResponse } from '@/types/order'

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()
    const {
      customer,
      shippingAddress,
      billingAddress,
      items,
      totalAmount,
      shippingCost,
      discountCode,
      discountAmount,
      discountType,
      notes,
      userId
    } = body

    // Validate required fields
    if (!customer.name || !customer.email || !customer.phone) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Calculate final amount with discount (in paise for Razorpay)
    const discountValue = discountAmount || 0
    const finalAmount = Math.round((totalAmount + shippingCost - discountValue) * 100)

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        customer_name: customer.name,
        customer_email: customer.email,
      },
    })

    // Transform shipping address to snake_case for database storage
    const shippingAddressDb = {
      address_line1: shippingAddress.addressLine1,
      address_line2: shippingAddress.addressLine2,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postal_code: shippingAddress.postalCode,
      country: shippingAddress.country,
    }

    const billingAddressDb = billingAddress ? {
      address_line1: billingAddress.addressLine1,
      address_line2: billingAddress.addressLine2,
      city: billingAddress.city,
      state: billingAddress.state,
      postal_code: billingAddress.postalCode,
      country: billingAddress.country,
    } : shippingAddressDb

    // Insert order into database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone,
        user_id: userId || null,
        status: 'pending',
        total_amount: totalAmount + shippingCost - discountValue,
        shipping_address: shippingAddressDb,
        billing_address: billingAddressDb,
        discount_code: discountCode || null,
        discount_amount: discountValue > 0 ? discountValue : null,
        discount_type: discountType || null,
        notes: notes || '',
        payment_status: 'pending',
        payment_method: 'razorpay',
        payment_reference: razorpayOrder.id,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Database error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order in database' },
        { status: 500 }
      )
    }

    // Insert order items with variant information
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      variant_size: item.variant?.size || null,
      variant_color: item.variant?.color || null,
      variant_color_name: item.variant?.colorName || null,
      variant_image: item.image || null,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items error:', itemsError)
      // Rollback: delete the order if items insertion fails
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    // If discount was applied, create order_discounts record
    if (discountCode && discountValue > 0) {
      // Get discount code ID
      const { data: discountCodeData } = await supabase
        .from('discount_codes')
        .select('id')
        .eq('code', discountCode)
        .single()

      if (discountCodeData) {
        // Create order_discounts junction record
        const { error: discountJunctionError } = await supabase
          .from('order_discounts')
          .insert({
            order_id: order.id,
            discount_code_id: discountCodeData.id,
            discount_amount: discountValue
          })

        if (discountJunctionError) {
          console.error('Error creating order_discounts record:', discountJunctionError)
          // Don't fail the order, but log the error
        }
      }
    }

    const response: CreateOrderResponse = {
      orderId: order.id,
      orderNumber: order.order_number,
      razorpayOrderId: razorpayOrder.id,
      amount: finalAmount,
      currency: 'INR',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
