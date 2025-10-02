'use client'

import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
  const { state, updateQuantity, removeItem } = useCart()
  const { items: cartItems, totalAmount } = state

  const shipping = totalAmount > 1000 ? 0 : 100 // Free shipping over ₹1000
  const total = totalAmount + shipping

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '3rem',
        textAlign: 'center',
        color: 'var(--text-primary)'
      }}>
        Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Your cart is empty
          </p>
          <Link href="/products" style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white',
            padding: '1rem 2rem',
            textDecoration: 'none',
            borderRadius: '12px',
            display: 'inline-block',
            fontSize: '1.1rem',
            fontWeight: '600',
            transition: 'transform 0.2s ease'
          }}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div>
          <div style={{ marginTop: '1rem' }}>
            {cartItems.map((item) => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1.5rem',
                borderBottom: '1px solid var(--border-light)',
                gap: '1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}>
                {item.image && (
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{item.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>₹{item.price}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  <span style={{ minWidth: '50px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '600' }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQuantity}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: item.quantity >= item.maxQuantity ? 'not-allowed' : 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: item.quantity >= item.maxQuantity ? 0.5 : 1
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{ minWidth: '100px', textAlign: 'right' }}>
                  <strong style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>₹{(item.price * item.quantity).toFixed(2)}</strong>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--error)',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    transition: 'background 0.2s ease'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '3rem',
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            maxWidth: '400px',
            marginLeft: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              <span>Subtotal:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              <span>Shipping:</span>
              <span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
            </div>
            <hr style={{ border: 'none', height: '1px', background: 'var(--border-light)', margin: '1rem 0' }} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '700',
              fontSize: '1.25rem',
              color: 'var(--accent-primary)'
            }}>
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              color: 'white',
              border: 'none',
              padding: '1.25rem',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginTop: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}