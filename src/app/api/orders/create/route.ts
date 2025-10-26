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
    const { customer, shippingAddress, billingAddress, items, totalAmount, shippingCost, notes, userId } = body

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

    // Calculate final amount (in paise for Razorpay)
    const finalAmount = Math.round((totalAmount + shippingCost) * 100)

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

    // Insert order into database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone,
        user_id: userId || null,
        status: 'pending',
        total_amount: totalAmount + shippingCost,
        shipping_address: shippingAddress,
        billing_address: billingAddress || shippingAddress,
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
