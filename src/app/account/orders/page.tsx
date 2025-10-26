'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NextImage from 'next/image'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Order } from '@/lib/supabase'
import ConfirmDialog from '@/components/ConfirmDialog'
import type {
  RazorpayOptions,
  RazorpaySuccessResponse,
  RazorpayErrorResponse,
  DbShippingAddress,
} from '@/types/order'
import styles from './page.module.css'

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [retryingPaymentOrderId, setRetryingPaymentOrderId] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null)

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
      console.error('Failed to load Razorpay script')
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

  const fetchOrders = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items!order_id(
            *,
            products(
              id,
              name,
              images
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Debug: Log the data structure
      console.log('Orders data:', data)
      if (data && data.length > 0) {
        console.log('First order structure:', data[0])
        console.log('Order items:', data[0].order_items)
      }

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchOrders()
    }
  }, [user, authLoading, router, fetchOrders])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: styles.statusPending,
      paid: styles.statusPaid,
      processing: styles.statusProcessing,
      shipped: styles.statusShipped,
      delivered: styles.statusDelivered,
      cancelled: styles.statusCancelled,
    }
    return statusClasses[status] || styles.statusPending
  }

  const handleCancelOrderClick = (orderId: string) => {
    setOrderToCancel(orderId)
    setCancelDialogOpen(true)
  }

  const handleCancelOrder = async () => {
    if (!user || !orderToCancel) return

    setCancelDialogOpen(false)
    setCancellingOrderId(orderToCancel)

    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderToCancel, userId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order')
      }

      toast.success('Order cancelled successfully')
      // Refresh orders list
      fetchOrders()
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order')
    } finally {
      setCancellingOrderId(null)
      setOrderToCancel(null)
    }
  }

  const handleCompletePayment = async (order: Order) => {
    if (!user) return

    if (!scriptLoaded || scriptError) {
      toast.error('Payment gateway is not available. Please refresh the page.')
      return
    }

    if (typeof window.Razorpay === 'undefined') {
      toast.error('Payment gateway failed to initialize. Please refresh the page.')
      return
    }

    setRetryingPaymentOrderId(order.id)

    try {
      // Step 1: Create new Razorpay order for retry
      const response = await fetch('/api/orders/retry-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to retry payment')
      }

      const retryData = await response.json()

      // Step 2: Open Razorpay checkout
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: retryData.amount,
        currency: retryData.currency,
        name: 'Winky Cats Store',
        description: `Order #${retryData.orderNumber}`,
        order_id: retryData.razorpayOrderId,
        handler: async (razorpayResponse: RazorpaySuccessResponse) => {
          await verifyRetryPayment(razorpayResponse, retryData.orderId)
        },
        prefill: {
          name: retryData.customerName,
          email: retryData.customerEmail,
          contact: retryData.customerPhone,
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: () => {
            setRetryingPaymentOrderId(null)
            toast.info('Payment cancelled')
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

      razorpay.on('payment.failed', function (response: RazorpayErrorResponse) {
        console.error('Payment failed:', response)
        setRetryingPaymentOrderId(null)
        toast.error('Payment failed. Please try again.')
      })
    } catch (error) {
      console.error('Payment retry error:', error)
      setRetryingPaymentOrderId(null)
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry payment'
      toast.error(errorMessage)
    }
  }

  const verifyRetryPayment = async (razorpayResponse: RazorpaySuccessResponse, orderId: string) => {
    try {
      const verifyResponse = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpaySignature: razorpayResponse.razorpay_signature,
          orderId,
        }),
      })

      if (!verifyResponse.ok) {
        throw new Error('Payment verification failed')
      }

      toast.success('Payment completed successfully!')
      // Refresh orders list
      fetchOrders()
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Payment verification failed. Please contact support.')
    } finally {
      setRetryingPaymentOrderId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⏳</div>
          <div className={styles.emptyStateText}>Loading orders...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/account" className={styles.backLink}>
          ← Back to Account
        </Link>
        <h1 className={styles.title}>My Orders</h1>
        <p className={styles.subtitle}>Track and manage your orders</p>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateText}>No orders yet</div>
          <p className={styles.subtitle}>
            Start shopping to see your orders here
          </p>
          <Link href="/products" className={styles.browseButton}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div className={styles.ordersContainer}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <div className={styles.orderNumber}>
                    Order #{order.order_number}
                  </div>
                  <div className={styles.orderDate}>
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <div className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                  {order.status}
                </div>
              </div>

              <div className={styles.orderDetails}>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>
                    Customer Name
                  </div>
                  <div className={styles.detailValue}>
                    {order.customer_name}
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>
                    Shipping Address
                  </div>
                  <div className={styles.detailValue}>
                    {order.shipping_address ? (
                      <span>
                        {(order.shipping_address as DbShippingAddress).address_line1 && (
                          <>
                            {(order.shipping_address as DbShippingAddress).address_line1}
                            {(order.shipping_address as DbShippingAddress).address_line2 && `, ${(order.shipping_address as DbShippingAddress).address_line2}`}
                            <br />
                          </>
                        )}
                        {(order.shipping_address as DbShippingAddress).city}, {(order.shipping_address as DbShippingAddress).state} {(order.shipping_address as DbShippingAddress).postal_code}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>
                    Total Amount
                  </div>
                  <div className={styles.detailValueAmount}>
                    {formatPrice(order.total_amount)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {order.order_items && order.order_items.length > 0 && (
                <div className={styles.orderItems}>
                  <h3 className={styles.itemsTitle}>Items Ordered</h3>
                  <div className={styles.itemsList}>
                    {order.order_items.map((item) => {
                      // Use variant image if available, otherwise use product default image
                      const itemImage = item.variant_image || item.products?.images?.[0]
                      // Build product name with variant info
                      const productName = item.products?.name || 'Product'
                      const variantInfo = []
                      if (item.variant_color_name) variantInfo.push(item.variant_color_name)
                      if (item.variant_size) variantInfo.push(item.variant_size)
                      const fullProductName = variantInfo.length > 0
                        ? `${productName} (${variantInfo.join(', ')})`
                        : productName

                      return (
                        <div key={item.id} className={styles.orderItem}>
                          {itemImage && (
                            <div className={styles.itemImage}>
                              <NextImage
                                src={itemImage}
                                alt={fullProductName}
                                width={80}
                                height={80}
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          <div className={styles.itemDetails}>
                            <div className={styles.itemName}>
                              {fullProductName}
                            </div>
                            <div className={styles.itemMeta}>
                              <span className={styles.itemQuantity}>
                                Qty: {item.quantity}
                              </span>
                            </div>
                          </div>
                          <div className={styles.itemTotal}>
                            {formatPrice(item.total_price)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Order Actions */}
              {order.status === 'pending' && (
                <div className={styles.orderActions}>
                  <button
                    onClick={() => handleCompletePayment(order)}
                    className={`${styles.actionBtn} ${styles.primaryBtn}`}
                    disabled={cancellingOrderId === order.id || retryingPaymentOrderId === order.id}
                  >
                    {retryingPaymentOrderId === order.id ? 'Processing...' : 'Complete Payment'}
                  </button>
                  <button
                    onClick={() => handleCancelOrderClick(order.id)}
                    className={`${styles.actionBtn} ${styles.dangerBtn}`}
                    disabled={cancellingOrderId === order.id || retryingPaymentOrderId === order.id}
                  >
                    {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false)
          setOrderToCancel(null)
        }}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Cancel Order"
        cancelText="Keep Order"
        confirmButtonStyle="danger"
        loading={cancellingOrderId !== null}
      />
    </div>
  )
}
