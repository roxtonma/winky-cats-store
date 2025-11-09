import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productType, designBrief, name, email, phone, budget, userId, referenceImageCount, referenceImageUrls } = body

    // Validate required fields
    if (!productType || !designBrief || !name || !email || !budget) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate phone format if provided (Indian phone numbers)
    if (phone && !/^[6-9][0-9]{9}$/.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit phone number' },
        { status: 400 }
      )
    }

    // Insert custom request into database
    const { data: customRequest, error: requestError } = await supabase
      .from('custom_requests')
      .insert({
        user_id: userId || null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        product_type: productType,
        design_brief: designBrief.trim(),
        budget: budget,
        has_reference_images: referenceImageCount > 0,
        reference_image_count: referenceImageCount || 0,
        reference_image_urls: referenceImageUrls || [],
        status: 'pending',
      })
      .select()
      .single()

    if (requestError) {
      console.error('Database error:', requestError)
      return NextResponse.json(
        { error: 'Failed to submit custom request. Please try again.' },
        { status: 500 }
      )
    }

    // Send Slack notification
    if (process.env.SLACK_WEBHOOK_CUSTOM_ORDERS) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_CUSTOM_ORDERS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: '🎨 New Custom Design Request!',
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '🎨 New Custom Design Request',
                  emoji: true
                }
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Request ID:*\n#${customRequest.id}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Product Type:*\n${productType}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Customer:*\n${name}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Budget:*\n₹${budget}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Email:*\n${email}`
                  }
                ]
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Design Brief:*\n${designBrief}`
                }
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Reference Images:*\n${referenceImageCount > 0 ? `${referenceImageCount} image(s) uploaded` : 'None'}`
                }
              },
              ...(referenceImageUrls && referenceImageUrls.length > 0 ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Image Links:*\n${referenceImageUrls.map((url: string, idx: number) => `<${url}|Image ${idx + 1}>`).join(' • ')}`
                  }
                }
              ] : []),
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `Submitted at <!date^${Math.floor(new Date().getTime() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`
                  }
                ]
              }
            ]
          })
        })
      } catch (slackError) {
        console.error('Failed to send Slack notification:', slackError)
        // Don't fail the request if Slack notification fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      requestId: customRequest.id,
      message: 'Custom design request submitted successfully!'
    })
  } catch (error) {
    console.error('Custom request creation error:', error)
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again later.' },
      { status: 500 }
    )
  }
}
