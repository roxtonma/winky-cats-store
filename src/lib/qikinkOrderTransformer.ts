import { QikinkOrderRequest, QikinkLineItem, QikinkShippingAddress, PrintTypes } from '@/types/qikink'
import { getQikinkSKU } from './qikinkSkuMapper'

// Database order structure from Supabase
export interface DbOrder {
  id: string
  order_number: string
  customer_email: string
  customer_name: string
  customer_phone: string
  total_amount: number
  payment_method: string
  payment_status: string
  shipping_address: {
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country?: string
  }
}

export interface DbOrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  variant_size?: string
  variant_color?: string
  variant_color_name?: string
}

export interface DbProduct {
  id: string
  sku: string
  name: string
  vendor?: string
  vendor_product_id?: string
  design_url?: string
  images: string[]
  print_areas?: unknown
  qikink_product_type?: string // Maps to Qikink product catalog
  qikink_gender?: string // Gender filter for Qikink SKU lookup
}

export interface OrderWithDetails {
  order: DbOrder
  items: Array<DbOrderItem & { product: DbProduct }>
}

export class QikinkOrderTransformer {
  /**
   * Transform our order format to Qikink's required format
   */
  static async transform(orderData: OrderWithDetails): Promise<QikinkOrderRequest> {
    const { order, items } = orderData

    // Transform line items
    const lineItems: QikinkLineItem[] = await Promise.all(
      items.map(async (item) => {
        const product = item.product

        // Determine if we're searching from Qikink's products or providing custom design
        const hasCustomDesign = product.design_url && product.design_url.trim() !== ''
        const searchFromMyProducts = hasCustomDesign ? 0 : 1

        // Build the SKU - use variant-specific Qikink SKU if available
        let sku = product.sku // Fallback to generic product SKU

        // Try to get variant-specific Qikink SKU
        if (item.variant_color_name && item.variant_size && product.qikink_product_type) {
          const qikinkSku = await getQikinkSKU({
            productType: product.qikink_product_type,
            colorName: item.variant_color_name,
            size: item.variant_size,
            gender: product.qikink_gender
          })

          if (qikinkSku) {
            sku = qikinkSku
            console.log(`✓ Mapped to Qikink SKU: ${sku} (${product.qikink_product_type}, ${item.variant_color_name}, ${item.variant_size})`)
          } else {
            console.warn(`⚠️  No Qikink SKU found for: ${product.qikink_product_type}, ${item.variant_color_name}, ${item.variant_size}`)
            console.warn(`   Falling back to: ${product.vendor_product_id || product.sku}`)

            // Fallback to vendor_product_id if available
            if (product.vendor_product_id) {
              sku = product.vendor_product_id
            }
          }
        } else if (product.vendor_product_id) {
          // Use vendor_product_id if no variant mapping available
          sku = product.vendor_product_id
          console.log(`→ Using vendor_product_id: ${sku}`)
        } else {
          console.warn(`⚠️  Missing variant info or qikink_product_type for product ${product.id}`)
          console.warn(`   variant_color_name: ${item.variant_color_name}`)
          console.warn(`   variant_size: ${item.variant_size}`)
          console.warn(`   qikink_product_type: ${product.qikink_product_type}`)
        }

        const lineItem: QikinkLineItem = {
          search_from_my_products: searchFromMyProducts,
          quantity: item.quantity,
          price: item.unit_price,
          sku: sku,
        }

        // If we have a custom design, add print_type_id and designs
        if (searchFromMyProducts === 0) {
          lineItem.print_type_id = PrintTypes.DTG // Default to DTG, can be customized per product
          lineItem.designs = [
            {
              design_code: `design-${product.id}`,
              placement_sku: 'fr', // Default to front placement
              design_link: product.design_url || '',
              mockup_link: product.images[0] || '', // Use first product image as mockup
            },
          ]
        }

        return lineItem
      })
    )

    // Transform shipping address
    const lastName = this.extractLastName(order.customer_name)
    const shippingAddress: QikinkShippingAddress = {
      first_name: this.extractFirstName(order.customer_name),
      ...(lastName && { last_name: lastName }), // Only include if not empty
      address1: order.shipping_address.address_line1,
      ...(order.shipping_address.address_line2 && { address2: order.shipping_address.address_line2 }), // Only include if not empty
      phone: order.customer_phone,
      email: order.customer_email,
      city: order.shipping_address.city,
      zip: parseInt(order.shipping_address.postal_code, 10), // Convert to number
      province: order.shipping_address.state,
      country_code: order.shipping_address.country || 'IN', // Default to India
    }

    // Determine payment gateway
    const gateway = order.payment_status === 'paid' ? 'Prepaid' : 'COD'

    // Build the Qikink order request
    const qikinkOrder: QikinkOrderRequest = {
      order_number: order.order_number,
      qikink_shipping: 1, // Let Qikink handle shipping (numeric)
      gateway: gateway,
      total_order_value: order.total_amount,
      line_items: lineItems,
      shipping_address: shippingAddress,
    }

    return qikinkOrder
  }

  /**
   * Extract first name from full name
   */
  private static extractFirstName(fullName: string): string {
    const parts = fullName.trim().split(' ')
    return parts[0] || fullName
  }

  /**
   * Extract last name from full name
   */
  private static extractLastName(fullName: string): string {
    const parts = fullName.trim().split(' ')
    if (parts.length > 1) {
      return parts.slice(1).join(' ')
    }
    return '' // No last name
  }

  /**
   * Validate if an order can be forwarded to Qikink
   */
  static canForwardOrder(order: DbOrder): { valid: boolean; reason?: string } {
    // Check if payment is confirmed
    if (order.payment_status !== 'paid') {
      return { valid: false, reason: 'Payment not confirmed' }
    }

    // Check if order has shipping address
    if (!order.shipping_address || !order.shipping_address.address_line1) {
      return { valid: false, reason: 'Missing shipping address' }
    }

    // Check required customer info
    if (!order.customer_name || !order.customer_email || !order.customer_phone) {
      return { valid: false, reason: 'Missing customer information' }
    }

    return { valid: true }
  }
}
