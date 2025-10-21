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

export interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: (response: unknown) => void) => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}
