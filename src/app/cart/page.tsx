'use client'

import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'
import Image from 'next/image'
import styles from './cart.module.css'

export default function CartPage() {
  const { state, updateQuantity, removeItem } = useCart()
  const { items: cartItems, totalAmount } = state

  const shipping = totalAmount > 1000 ? 0 : 100 // Free shipping over ₹1000
  const total = totalAmount + shipping

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className={styles.emptyCart}>
          <p>Your cart is empty</p>
          <Link href="/products" className={styles.continueShoppingBtn}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div>
          <div className={styles.cartItems}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                {item.image && (
                  <div className={styles.cartItemImage}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div className={styles.cartItemInfo}>
                  <h3 className={styles.cartItemName}>{item.name}</h3>
                  <p className={styles.cartItemPrice}>₹{item.price}</p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className={styles.removeBtn}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  ×
                </button>

                <div className={styles.quantityControls}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className={styles.quantityBtn}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className={styles.quantityValue}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQuantity}
                    className={styles.quantityBtn}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className={styles.cartItemTotal}>
                  <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.checkoutSection}>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping:</span>
              <span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
            </div>
            <hr className={styles.summaryDivider} />
            <div className={styles.totalRow}>
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button className={styles.checkoutBtn}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}