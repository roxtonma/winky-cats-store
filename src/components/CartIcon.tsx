'use client'

import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'

export default function CartIcon() {
  const { state } = useCart()
  const { totalItems } = state

  return (
    <Link href="/cart" style={{
      color: 'var(--text-secondary)',
      fontWeight: '500',
      transition: 'color 0.2s ease',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <div style={{ position: 'relative' }}>
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
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: 'var(--accent-primary)',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>
      <span>Cart</span>
    </Link>
  )
}