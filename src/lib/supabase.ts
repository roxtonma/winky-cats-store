import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type Category = {
  id: string
  name: string
  description?: string
  slug: string
  image_url?: string
  created_at: string
  updated_at: string
}

export type ColorVariant = {
  colorId: string
  colorName: string
  colorHex: string
  images: string[]
}

export type Product = {
  id: string
  name: string
  description?: string
  price: number
  compare_at_price?: number
  sku?: string
  inventory_quantity: number
  category_id?: string
  category?: {
    id: string
    name: string
    slug: string
  }
  images?: string[]
  is_active: boolean
  weight?: number
  tags?: string[]
  variants?: {
    colors?: ColorVariant[]
    sizes?: string[]
  }
  fabric_details?: string
  fit_info?: string
  care_instructions?: string
  created_at: string
  updated_at: string
  is_layerable?: boolean
  layer_order?: number
  layer_position?: { x: number; y: number }
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  variant_size?: string
  variant_color?: string
  variant_color_name?: string
  variant_image?: string
  created_at: string
  products?: {
    id: string
    name: string
    images?: string[]
  }
}

export type Order = {
  id: string
  order_number: string
  customer_email: string
  customer_name: string
  customer_phone?: string
  user_id?: string
  status: string
  total_amount: number
  shipping_address?: Record<string, unknown>
  billing_address?: Record<string, unknown>
  notes?: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export type TryOnUsage = {
  id: string
  identifier: string
  identifier_type: 'ip' | 'phone'
  product_id?: string
  user_id?: string
  attempt_count: number
  last_attempt_at: string
  created_at: string
}

export type UserProfile = {
  id: string
  user_id: string
  phone_number: string
  name: string
  email?: string
  has_purchased: boolean
  created_at: string
  updated_at: string
}

export type UserAddress = {
  id: string
  user_id: string
  label?: string
  full_name: string
  phone_number: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}