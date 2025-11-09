'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './order-success.module.css'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState('')

  useEffect(() => {
    const number = searchParams.get('orderNumber')
    if (number) {
      setOrderNumber(number)
    }
  }, [searchParams])

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.iconContainer}>
          <svg
            className={styles.checkIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className={styles.title}>Order Placed Successfully!</h1>

        {orderNumber && (
          <div className={styles.orderInfo}>
            <p className={styles.orderLabel}>Order Number:</p>
            <p className={styles.orderNumber}>{orderNumber}</p>
          </div>
        )}

        <p className={styles.message}>
          Thank you for your purchase! We&apos;ve received your order and will process it shortly. Till then please check your &apos;My Orders&apos; page.
        </p>

        <div className={styles.actions}>
          <Link href="/products" className={styles.primaryBtn}>
            Continue Shopping
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.successCard}>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
