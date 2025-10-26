import { CartItem } from '@/contexts/CartContext'

export type ShippingAddress = {
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

// Database shipping address format (snake_case from Supabase)
export type DbShippingAddress = {
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
}

export type CustomerInfo = {
  name: string
  email: string
  phone: string
}

export type CreateOrderRequest = {
  customer: CustomerInfo
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress
  items: CartItem[]
  totalAmount: number
  shippingCost: number
  notes?: string
  userId?: string
}

export type CreateOrderResponse = {
  orderId: string
  orderNumber: string
  razorpayOrderId: string
  amount: number
  currency: string
}

export type VerifyPaymentRequest = {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  orderId: string
}

export type VerifyPaymentResponse = {
  success: boolean
  orderId: string
  orderNumber: string
}

// Razorpay types for browser SDK
export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpaySuccessResponse) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface RazorpayErrorResponse {
  error: {
    code: string
    description: string
    source: string
    step: string
    reason: string
    metadata: {
      order_id: string
      payment_id: string
    }
  }
}

export interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: (response: RazorpayErrorResponse) => void) => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}
