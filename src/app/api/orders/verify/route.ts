import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { Resend } from 'resend'
import { VerifyPaymentRequest, VerifyPaymentResponse } from '@/types/order'
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter'
import { config } from '@/lib/config'
import { rateLimitError, paymentError, databaseError, internalError, logError } from '@/lib/errors'
import OrderConfirmationEmail from '@/emails/OrderConfirmation'

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Resend client (only if API key is provided)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = getClientIp(request)
    const rateLimitKey = `payment-verify:${clientIp}`
    const { maxAttempts, windowMs } = config.rateLimits.paymentVerification
    const rateLimitResult = checkRateLimit(rateLimitKey, maxAttempts, windowMs)

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
      logError('Payment Verification Rate Limit', `IP ${clientIp} exceeded rate limit`, {
        remaining: rateLimitResult.remaining,
        retryAfter,
      })
      return rateLimitError(
        `Too many verification attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
      )
    }

    const body: VerifyPaymentRequest = await request.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = body

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (generatedSignature !== razorpaySignature) {
      logError('Payment Signature Verification Failed', 'Signature mismatch', {
        orderId,
        razorpayOrderId,
        ip: clientIp,
      })
      return paymentError('Payment verification failed')
    }

    // Update order in database
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        payment_reference: razorpayPaymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      logError('Database Update Error', updateError, { orderId })
      return databaseError('Failed to update order status')
    }

    // Fetch order items for email
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*, product:products(name)')
      .eq('order_id', order.id)

    if (!itemsError && orderItems && resend) {
      // Send order confirmation email
      try {
        const emailItems = orderItems.map((item: { product?: { name?: string }; quantity: number; unit_price: number }) => ({
          name: item.product?.name || 'Product',
          quantity: item.quantity,
          price: item.unit_price,
          variant: undefined, // Variants not stored in order_items currently
        }))

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: order.customer_email,
          subject: `Order Confirmation - #${order.order_number}`,
          react: OrderConfirmationEmail({
            orderNumber: order.order_number,
            customerName: order.customer_name,
            items: emailItems,
            total: order.total_amount,
            shippingAddress: order.shipping_address,
          }),
        })

        console.log('Order confirmation email sent to:', order.customer_email)
      } catch (emailError) {
        // Log email error but don't fail the order
        console.error('Failed to send order confirmation email:', emailError)
        logError('Email Send Error', emailError, { orderId: order.id })
      }
    }

    const response: VerifyPaymentResponse = {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    }

    return NextResponse.json(response)
  } catch (error) {
    logError('Payment Verification Error', error)
    return internalError('Payment verification failed')
  }
}
