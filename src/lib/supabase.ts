import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  }
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  order_number: string
  customer_email: string
  customer_name: string
  customer_phone?: string
  status: string
  total_amount: number
  shipping_address?: Record<string, unknown>
  billing_address?: Record<string, unknown>
  notes?: string
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}