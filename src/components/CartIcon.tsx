'use client'

import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './CartIcon.module.css'

export default function CartIcon() {
  const { state } = useCart()
  const { totalItems } = state
  const [isCartUpdated, setIsCartUpdated] = useState(false)

  useEffect(() => {
    if (totalItems > 0) {
      setIsCartUpdated(true)
      const timer = setTimeout(() => setIsCartUpdated(false), 300)
      return () => clearTimeout(timer)
    }
  }, [totalItems])

  return (
    <Link href="/cart" className={styles.cartLink} aria-label="View shopping cart">
      <div className={`${styles.iconWrapper} ${isCartUpdated ? styles.updated : ''}`}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23.1 4H5.12" />
        </svg>
        {totalItems > 0 && (
          <span className={styles.badge} aria-label={`${totalItems} items in cart`}>
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>
      <span>Cart</span>
    </Link>
  )
}