import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { Resend } from 'resend'
import { VerifyPaymentRequest, VerifyPaymentResponse } from '@/types/order'
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter'
import { config } from '@/lib/config'
import { rateLimitError, paymentError, databaseError, internalError, logError } from '@/lib/errors'

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

        // Transform shipping address to match email component's expected format (camelCase)
        const shippingAddr = order.shipping_address as Record<string, string | undefined>
        const formattedShippingAddress = {
          name: order.customer_name,
          addressLine1: shippingAddr.address_line1 || shippingAddr.addressLine1 || '',
          addressLine2: shippingAddr.address_line2 || shippingAddr.addressLine2,
          city: shippingAddr.city || '',
          state: shippingAddr.state || '',
          postalCode: shippingAddr.postal_code || shippingAddr.postalCode || '',
          country: shippingAddr.country || 'India',
          phone: order.customer_phone,
        }

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: order.customer_email,
          subject: `Order Confirmation - #${order.order_number}`,
          html: `
            <h1>Order Confirmation</h1>
            <p>Thank you for your order, ${order.customer_name}!</p>
            <p>Order Number: ${order.order_number}</p>
            <p>Total Amount: ₹${order.total_amount}</p>
            <h2>Items:</h2>
            <ul>
              ${emailItems.map(item => `<li>${item.name} x ${item.quantity} - ₹${item.price}</li>`).join('')}
            </ul>
            <h2>Shipping Address:</h2>
            <p>
              ${formattedShippingAddress.addressLine1}<br>
              ${formattedShippingAddress.addressLine2 ? formattedShippingAddress.addressLine2 + '<br>' : ''}
              ${formattedShippingAddress.city}, ${formattedShippingAddress.state} ${formattedShippingAddress.postalCode}<br>
              ${formattedShippingAddress.country}
            </p>
          `,
        })

        console.log('Order confirmation email sent to:', order.customer_email)
      } catch (emailError) {
        // Log email error but don't fail the order
        console.error('Failed to send order confirmation email:', emailError)
        logError('Email Send Error', emailError, { orderId: order.id })
      }
    }

    // Send Slack notification for successful order
    if (process.env.SLACK_WEBHOOK_NORMAL_ORDERS) {
      try {
        const itemsText = orderItems && orderItems.length > 0
          ? orderItems.map((item: { product?: { name?: string }, variant_size?: string, variant_color_name?: string, quantity: number, unit_price: number }) => {
              const productName = item.product?.name || 'Product'
              const size = item.variant_size ? ` (${item.variant_size})` : ''
              const color = item.variant_color_name ? `, ${item.variant_color_name}` : ''
              return `• ${productName}${color}${size} x ${item.quantity} - ₹${item.unit_price * item.quantity}`
            }).join('\n')
          : '• No items'

        await fetch(process.env.SLACK_WEBHOOK_NORMAL_ORDERS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: '✅ New Order Received & Paid!',
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '✅ New Order Received & Paid',
                  emoji: true
                }
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Order Number:*\n${order.order_number}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Customer:*\n${order.customer_name}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Email:*\n${order.customer_email}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Total Amount:*\n₹${order.total_amount}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Payment ID:*\n\`${order.payment_reference}\``
                  }
                ]
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Items:*\n${itemsText}`
                }
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Order Status:*\nConfirmed & Forwarding to Qikink for Fulfillment`
                }
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `Placed at <!date^${Math.floor(new Date().getTime() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`
                  }
                ]
              }
            ]
          })
        })
      } catch (slackError) {
        console.error('Failed to send Slack notification for order:', slackError)
        // Don't fail the request if Slack notification fails
      }
    }

    // Forward order to Qikink for fulfillment (non-blocking)
    if (process.env.QIKINK_CLIENT_ID && process.env.QIKINK_CLIENT_SECRET) {
      // Don't await - forward asynchronously to avoid delaying response
      fetch(`${request.nextUrl.origin}/api/qikink/forward-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      })
        .then(async (res) => {
          if (res.ok) {
            console.log('Order forwarded to Qikink:', order.order_number)
          } else {
            const errorData = await res.json().catch(() => ({}))
            console.error('Failed to forward order to Qikink:', errorData)
          }
        })
        .catch((error) => {
          console.error('Error calling Qikink forward-order API:', error)
        })
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
