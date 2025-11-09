import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// Generate a unique 6-character alphanumeric string
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate unique discount code with format WELCOME10-XXXXXX
async function generateUniqueDiscountCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const code = `WELCOME10-${generateRandomCode()}`

    // Check if code already exists
    const { data, error } = await supabase
      .from('discount_codes')
      .select('code')
      .eq('code', code)
      .single()

    if (error || !data) {
      // Code is unique
      return code
    }

    attempts++
  }

  throw new Error('Failed to generate unique discount code')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if email already subscribed
    const { data: existingSubscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id, discount_code, is_active')
      .eq('email', normalizedEmail)
      .single()

    if (existingSubscriber) {
      if (existingSubscriber.is_active) {
        return NextResponse.json(
          {
            error: 'This email is already subscribed to our newsletter',
            alreadySubscribed: true
          },
          { status: 409 }
        )
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ is_active: true })
          .eq('id', existingSubscriber.id)

        if (updateError) throw updateError

        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
          discountCode: existingSubscriber.discount_code,
          reactivated: true
        })
      }
    }

    // Generate unique discount code
    const discountCode = await generateUniqueDiscountCode()

    // Calculate expiry date (30 days from now)
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)

    // Create discount code in database
    const { error: discountError } = await supabase
      .from('discount_codes')
      .insert({
        code: discountCode,
        type: 'percentage',
        value: 10,
        is_active: true,
        valid_until: validUntil.toISOString(),
        max_uses: 1,
        current_uses: 0,
        min_order_amount: 0,
        description: 'Newsletter welcome discount - 10% off your first order'
      })

    if (discountError) {
      console.error('Error creating discount code:', discountError)
      throw new Error('Failed to create discount code')
    }

    // Create newsletter subscriber
    const { error: subscriberError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        discount_code: discountCode,
        discount_code_used: false,
        is_active: true
      })

    if (subscriberError) {
      console.error('Error creating subscriber:', subscriberError)
      throw new Error('Failed to create newsletter subscription')
    }

    // Send welcome email via Resend
    try {
      await resend.emails.send({
        from: 'Winky Cats <noreply@winkycats.com>',
        to: normalizedEmail,
        subject: 'Welcome to Winky Cats! Here\'s 10% off 🎁',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f9f9f9;
                }
                .container {
                  background-color: #ffffff;
                  border-radius: 16px;
                  padding: 40px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  font-size: 32px;
                  font-weight: 700;
                  color: #FF69B4;
                  margin-bottom: 10px;
                }
                h1 {
                  color: #1a1a1a;
                  font-size: 28px;
                  margin: 0 0 20px 0;
                }
                .discount-box {
                  background: linear-gradient(135deg, #FF69B4, #FF1493);
                  color: white;
                  padding: 30px;
                  border-radius: 12px;
                  text-align: center;
                  margin: 30px 0;
                }
                .discount-code {
                  font-size: 32px;
                  font-weight: 700;
                  letter-spacing: 2px;
                  margin: 10px 0;
                  padding: 15px;
                  background: rgba(255, 255, 255, 0.2);
                  border-radius: 8px;
                  border: 2px dashed white;
                }
                .discount-details {
                  font-size: 14px;
                  margin-top: 15px;
                  opacity: 0.9;
                }
                .cta-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #FF69B4, #FF1493);
                  color: white;
                  padding: 16px 40px;
                  text-decoration: none;
                  border-radius: 10px;
                  font-weight: 600;
                  margin: 20px 0;
                  font-size: 16px;
                }
                .features {
                  margin: 30px 0;
                }
                .feature {
                  margin: 15px 0;
                  padding-left: 30px;
                  position: relative;
                }
                .feature:before {
                  content: "✓";
                  position: absolute;
                  left: 0;
                  color: #FF69B4;
                  font-weight: 700;
                  font-size: 20px;
                }
                .footer {
                  text-align: center;
                  margin-top: 40px;
                  padding-top: 30px;
                  border-top: 1px solid #eee;
                  font-size: 14px;
                  color: #666;
                }
                .unsubscribe {
                  color: #999;
                  text-decoration: none;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">Winky Cats</div>
                  <h1>Welcome to the Family! 🎉</h1>
                  <p>Thank you for subscribing to our newsletter. We're excited to have you!</p>
                </div>

                <div class="discount-box">
                  <div style="font-size: 18px; margin-bottom: 10px;">Your Exclusive Discount Code</div>
                  <div class="discount-code">${discountCode}</div>
                  <div class="discount-details">
                    10% OFF your first order | Valid for 30 days | One-time use
                  </div>
                </div>

                <div style="text-align: center;">
                  <a href="https://winkycats.com/products" class="cta-button">Start Shopping</a>
                </div>

                <div class="features">
                  <div class="feature">Premium quality cotton tees - 180 GSM fabric</div>
                  <div class="feature">Minimalist and pastel aesthetic designs</div>
                  <div class="feature">Curated notebooks and accessories</div>
                  <div class="feature">Free shipping on orders over ₹999</div>
                  <div class="feature">Easy returns and exchanges</div>
                </div>

                <p style="text-align: center; color: #666; margin-top: 30px;">
                  Questions? Just reply to this email - we're here to help!
                </p>

                <div class="footer">
                  <p>You're receiving this email because you subscribed to Winky Cats newsletter.</p>
                  <a href="#" class="unsubscribe">Unsubscribe</a>
                </div>
              </div>
            </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Don't fail the request if email fails - subscriber is still created
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! Check your email for your discount code.',
      discountCode
    })

  } catch (error) {
    console.error('Error in newsletter subscription:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter. Please try again.' },
      { status: 500 }
    )
  }
}
