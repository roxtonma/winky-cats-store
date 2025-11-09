// Qikink API Types based on their API documentation

export type PrintType = 1 | 2 | 3 | 5 | 6 | 7 | 8 | 9 | 12 | 13 | 14 | 15 | 17

export const PrintTypes = {
  DTG: 1,
  ALL_OVER_PRINTED: 2,
  EMBROIDERY: 3,
  ACCESSORIES: 5,
  PUFF_PRINT: 6,
  GLOW_IN_DARK: 7,
  RAINBOW_VINYL: 12,
  GOLD_VINYL: 13,
  SILVER_VINYL: 14,
  REFLECTIVE_GREY_VINYL: 15,
  DTF: 17,
} as const

export type PlacementSku = 'fr' | 'bk' | 'lp' | 'rp' | 'rs' | 'ls'

export const PlacementSkus = {
  FRONT: 'fr',
  BACK: 'bk',
  LEFT_POCKET: 'lp',
  RIGHT_POCKET: 'rp',
  RIGHT_SHOULDER: 'rs',
  LEFT_SHOULDER: 'ls',
} as const

export interface QikinkDesign {
  design_code: string
  width_inches?: string | number
  height_inches?: string | number
  placement_sku?: PlacementSku
  design_link?: string
  mockup_link: string
}

export interface QikinkLineItem {
  search_from_my_products: 0 | 1
  print_type_id?: PrintType
  quantity: number
  price: number
  sku: string
  designs?: QikinkDesign[]
}

export interface QikinkShippingAddress {
  first_name: string
  last_name?: string
  address1: string
  address2?: string
  phone: string
  email: string
  city: string
  zip: number
  province: string
  country_code: string
}

export interface QikinkOrderRequest {
  order_number: string
  qikink_shipping: 0 | 1
  gateway: 'COD' | 'Prepaid'
  total_order_value: number
  line_items: QikinkLineItem[]
  shipping_address?: QikinkShippingAddress
}

export interface QikinkOrderResponse {
  success: boolean
  message?: string
  order_id?: string
  qikink_order_id?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface QikinkErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}
