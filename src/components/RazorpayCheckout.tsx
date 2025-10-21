'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  CustomerInfo,
  ShippingAddress,
  RazorpayOptions,
  RazorpaySuccessResponse,
} from '@/types/order'

interface RazorpayCheckoutProps {
  customer: CustomerInfo
  shippingAddress: ShippingAddress
  totalAmount: number
  shippingCost: number
  onSuccess: (orderNumber: string) => void
  onError?: (error: string) => void
  isFormValid?: () => boolean
}

export default function RazorpayCheckout({
  customer,
  shippingAddress,
  totalAmount,
  shippingCost,
  onSuccess,
  onError,
  isFormValid,
}: RazorpayCheckoutProps) {
  const { state, clearCart } = useCart()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      setScriptLoaded(true)
      setScriptError(false)
    }
    script.onerror = () => {
      toast.error('Failed to load payment gateway. Please refresh the page.')
      setScriptLoaded(false)
      setScriptError(true)
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handlePayment = async () => {
    // Validate form before proceeding
    if (isFormValid && !isFormValid()) {
      toast.error('Please fill all required fields correctly')
      return
    }

    if (!scriptLoaded || scriptError) {
      toast.error('Payment gateway is not available. Please refresh the page.')
      return
    }

    // Runtime check for Razorpay object
    if (typeof window.Razorpay === 'undefined') {
      toast.error('Payment gateway failed to initialize. Please refresh the page.')
      setScriptError(true)
      return
    }

    if (state.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create order
      const orderRequest: CreateOrderRequest = {
        customer,
        shippingAddress,
        billingAddress: shippingAddress, // Using same address for billing
        items: state.items,
        totalAmount,
        shippingCost,
        userId: user?.id, // Include user ID if logged in
      }

      const createResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderRequest),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const orderData: CreateOrderResponse = await createResponse.json()

      // Step 2: Open Razorpay checkout
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Winky Cats Store',
        description: `Order #${orderData.orderNumber}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response: RazorpaySuccessResponse) => {
          await verifyPayment(response, orderData.orderId)
        },
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
            toast.info('Payment cancelled')
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

      razorpay.on('payment.failed', function (response: unknown) {
        console.error('Payment failed:', response)
        setLoading(false)
        toast.error('Payment failed. Please try again.')
        if (onError) {
          onError('Payment failed')
        }
      })
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment'
      toast.error(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  const verifyPayment = async (
    response: RazorpaySuccessResponse,
    orderId: string
  ) => {
    try {
      const verifyResponse = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          orderId,
        }),
      })

      if (!verifyResponse.ok) {
        throw new Error('Payment verification failed')
      }

      const verifyData = await verifyResponse.json()

      // Clear cart with error handling to prevent race conditions
      try {
        clearCart()
        // Also clear from localStorage as a backup
        localStorage.removeItem('cart')
      } catch (cartError) {
        console.error('Error clearing cart:', cartError)
        // Even if cart clear fails, the order was successful
        // User can manually clear cart later
      }

      toast.success('Order placed successfully!')
      onSuccess(verifyData.orderNumber)
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Payment verification failed. Please contact support with order ID.')
      if (onError) {
        onError('Payment verification failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading || !scriptLoaded || scriptError}
      className="razorpay-checkout-btn"
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        color: 'white',
        border: 'none',
        padding: '1rem',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: loading || !scriptLoaded || scriptError ? 'not-allowed' : 'pointer',
        transition: 'transform 0.2s ease',
        opacity: loading || !scriptLoaded || scriptError ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!loading && scriptLoaded && !scriptError) {
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {loading
        ? 'Processing...'
        : scriptError
        ? 'Payment Gateway Error'
        : !scriptLoaded
        ? 'Loading Payment Gateway...'
        : 'Proceed to Payment'}
    </button>
  )
}
