'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Order } from '@/lib/supabase'
import styles from './page.module.css'

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchOrders()
    }
  }, [user, authLoading, router])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

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
                    Customer
                  </div>
                  <div className={styles.detailValue}>
                    {order.customer_name}
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
                {order.customer_phone && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>
                      Phone
                    </div>
                    <div className={styles.detailValue}>
                      {order.customer_phone}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
