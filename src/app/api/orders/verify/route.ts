import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { VerifyPaymentRequest, VerifyPaymentResponse } from '@/types/order'
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter'
import { config } from '@/lib/config'
import { rateLimitError, paymentError, databaseError, internalError, logError } from '@/lib/errors'

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
