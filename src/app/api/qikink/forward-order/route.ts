import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { qikinkClient, QikinkAPIError } from '@/lib/qikinkClient'
import { QikinkOrderTransformer, OrderWithDetails, DbOrder, DbOrderItem, DbProduct } from '@/lib/qikinkOrderTransformer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Fetch order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if already forwarded to Qikink
    if (order.qikink_order_id) {
      return NextResponse.json(
        {
          error: 'Order already forwarded to Qikink',
          qikinkOrderId: order.qikink_order_id
        },
        { status: 409 }
      )
    }

    // Validate order can be forwarded
    const validation = QikinkOrderTransformer.canForwardOrder(order as DbOrder)
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Cannot forward order: ${validation.reason}` },
        { status: 400 }
      )
    }

    // Fetch order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*, product:products(*)')
      .eq('order_id', orderId)

    if (itemsError || !orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Order items not found' },
        { status: 404 }
      )
    }

    // Transform items to include product data
    const itemsWithProducts = orderItems.map(item => ({
      ...item,
      product: item.product as unknown as DbProduct
    })) as Array<DbOrderItem & { product: DbProduct }>

    // Prepare order data for transformation
    const orderData: OrderWithDetails = {
      order: order as DbOrder,
      items: itemsWithProducts
    }

    // Transform to Qikink format
    const qikinkOrder = await QikinkOrderTransformer.transform(orderData)

    // Forward order to Qikink with retry logic
    let qikinkResponse
    try {
      qikinkResponse = await qikinkClient.createOrderWithRetry(qikinkOrder)
    } catch (error) {
      // Log error to database
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error instanceof QikinkAPIError
          ? {
              message: error.message,
              statusCode: error.statusCode,
              errors: error.errors
            }
          : {
              message: error instanceof Error ? error.message : 'Unknown error'
            },
        request: qikinkOrder
      }

      await supabase
        .from('orders')
        .update({ qikink_error_log: errorLog })
        .eq('id', orderId)

      // Send Slack notification for failed order forwarding
      if (process.env.SLACK_WEBHOOK_NORMAL_ORDERS) {
        try {
          await fetch(process.env.SLACK_WEBHOOK_NORMAL_ORDERS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: '❌ Failed to Forward Order to Qikink',
              blocks: [
                {
                  type: 'header',
                  text: {
                    type: 'plain_text',
                    text: '❌ Qikink Order Forwarding Failed',
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
                      text: `*Order ID:*\n${orderId}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Customer:*\n${order.customer_name}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Amount:*\n₹${order.total_amount}`
                    }
                  ]
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Error:*\n\`\`\`${error instanceof Error ? error.message : 'Unknown error'}\`\`\``
                  }
                },
                ...(error instanceof QikinkAPIError && error.errors ? [
                  {
                    type: 'section',
                    text: {
                      type: 'mrkdwn',
                      text: `*Validation Errors:*\n\`\`\`${JSON.stringify(error.errors, null, 2)}\`\`\``
                    }
                  }
                ] : []),
                {
                  type: 'context',
                  elements: [
                    {
                      type: 'mrkdwn',
                      text: `Failed at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}> | Manual retry required`
                    }
                  ]
                }
              ]
            })
          })
        } catch (slackError) {
          console.error('Failed to send Slack notification:', slackError)
        }
      }

      throw error
    }

    // Update order with Qikink details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        qikink_order_id: qikinkResponse.qikink_order_id || qikinkResponse.order_id,
        qikink_forwarded_at: new Date().toISOString(),
        vendor: 'qikink',
        qikink_error_log: null, // Clear any previous errors
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order with Qikink details:', updateError)
      // Don't fail the request - order was successfully forwarded
    }

    // Send Slack notification for successful forwarding (optional)
    if (process.env.SLACK_WEBHOOK_NORMAL_ORDERS) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_NORMAL_ORDERS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: '✅ Order Forwarded to Qikink',
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '✅ Order Forwarded to Qikink',
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
                    text: `*Qikink Order ID:*\n\`${qikinkResponse.qikink_order_id || qikinkResponse.order_id}\``
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Customer:*\n${order.customer_name}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Status:*\nIn Production`
                  }
                ]
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `Forwarded at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`
                  }
                ]
              }
            ]
          })
        })
      } catch (slackError) {
        console.error('Failed to send Slack notification for successful forwarding:', slackError)
        // Don't fail the request if Slack notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order successfully forwarded to Qikink',
      orderId: orderId,
      orderNumber: order.order_number,
      qikinkOrderId: qikinkResponse.qikink_order_id || qikinkResponse.order_id,
      qikinkResponse: qikinkResponse
    })

  } catch (error) {
    console.error('Error forwarding order to Qikink:', error)

    if (error instanceof QikinkAPIError) {
      return NextResponse.json(
        {
          error: 'Qikink API Error',
          message: error.message,
          details: error.errors
        },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to forward order to Qikink',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
