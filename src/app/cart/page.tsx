'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import RazorpayCheckout from '@/components/RazorpayCheckout'
import type { CustomerInfo, ShippingAddress } from '@/types/order'
import { config } from '@/lib/config'
import { validateShippingForm, type ShippingFormErrors } from '@/lib/validation'
import { supabase, UserAddress } from '@/lib/supabase'
import styles from './cart.module.css'

export default function CartPage() {
  const { state, updateQuantity, removeItem } = useCart()
  const { items: cartItems, totalAmount } = state
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()

  const shipping = totalAmount > config.shipping.freeShippingThreshold ? 0 : config.shipping.defaultShippingCost
  const total = totalAmount + shipping

  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; phone?: string }>({})

  // Load saved addresses when checkout form is shown
  useEffect(() => {
    if (user && showCheckoutForm) {
      loadSavedAddresses()
    }
  }, [user, showCheckoutForm])

  const loadSavedAddresses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedAddresses(data || [])

      // Auto-select default address or first address
      const defaultAddress = data?.find(addr => addr.is_default)
      const addressToUse = defaultAddress || data?.[0]

      if (addressToUse) {
        setSelectedAddressId(addressToUse.id)
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  // Pre-fill form with user profile data if available
  useEffect(() => {
    if (userProfile && authCheckComplete) {
      setFormData({
        name: userProfile.name,
        email: userProfile.email || '',
        phone: userProfile.phone_number,
      })
    }
  }, [userProfile, authCheckComplete])

  // Handle address selection change
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error for this field when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined,
      })
    }
  }

  const handleCheckoutClick = () => {
    // Check if user is logged in
    if (!user) {
      // Store intended action and redirect to login
      sessionStorage.setItem('redirectAfterLogin', '/cart')
      router.push('/login')
      return
    }

    // Check if user has completed profile setup
    if (!userProfile) {
      router.push('/account/setup')
      return
    }

    setAuthCheckComplete(true)
    setShowCheckoutForm(true)
  }

  const handleOrderSuccess = (orderNumber: string) => {
    router.push(`/order-success?orderNumber=${orderNumber}`)
  }

  const isFormValid = () => {
    // Basic validation for name, email, phone
    const newErrors: typeof formErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    // Email validation removed - using userProfile email (locked field)
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Valid 10-digit phone number is required'
    }
    if (!selectedAddressId) {
      return false // No address selected
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId)

  const customerInfo: CustomerInfo = {
    name: formData.name,
    email: userProfile?.email || user?.email || '',
    phone: formData.phone,
  }

  const shippingAddress: ShippingAddress = selectedAddress ? {
    name: selectedAddress.full_name,
    phone: selectedAddress.phone_number,
    addressLine1: selectedAddress.address_line1,
    addressLine2: selectedAddress.address_line2 || '',
    city: selectedAddress.city,
    state: selectedAddress.state,
    postalCode: selectedAddress.postal_code,
    country: selectedAddress.country,
  } : {
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  }

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
            {cartItems.map((item) => {
              // Create unique key combining ID and variant info
              const itemKey = item.variant
                ? `${item.id}-${item.variant.size || 'nosize'}-${item.variant.colorName || 'nocolor'}`
                : item.id

              return (
              <div key={itemKey} className={styles.cartItem}>
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
                  <h3 className={styles.cartItemName}>
                    {item.name}
                    {item.variant && (item.variant.size || item.variant.colorName) &&
                      ` (${[item.variant.size, item.variant.colorName].filter(Boolean).join(', ')})`
                    }
                  </h3>
                  <p className={styles.cartItemPrice}>₹{item.price}</p>
                </div>

                <button
                  onClick={() => removeItem(item.id, item.variant)}
                  className={styles.removeBtn}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  ×
                </button>

                <div className={styles.quantityControls}>
                  <button
                    onClick={() => updateQuantity(item.id, item.variant, item.quantity - 1)}
                    className={styles.quantityBtn}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className={styles.quantityValue}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
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
              )
            })}
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

            {!showCheckoutForm ? (
              <button className={styles.checkoutBtn} onClick={handleCheckoutClick}>
                Proceed to Checkout
              </button>
            ) : (
              <div className={styles.checkoutForm}>
                <h2 className={styles.formTitle}>Checkout</h2>

                {/* No saved addresses - redirect user */}
                {savedAddresses.length === 0 ? (
                  <div className={styles.noAddressMessage}>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                      Please add a delivery address before checking out.
                    </p>
                    <Link href="/account" className={styles.addAddressButton}>
                      Go to Account &rarr; Add Address
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Address Selector */}
                    <div className={styles.addressSelector}>
                      <label htmlFor="addressSelect" className={styles.addressLabel}>
                        Select Delivery Address
                      </label>
                      <select
                        id="addressSelect"
                        className={styles.addressSelect}
                        value={selectedAddressId}
                        onChange={(e) => handleAddressSelect(e.target.value)}
                      >
                        {savedAddresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.label ? `${address.label} - ` : ''}
                            {address.full_name}, {address.city}
                            {address.is_default && ' (Default)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Display selected address */}
                    {selectedAddress && (
                      <div className={styles.selectedAddressDisplay}>
                        <div className={styles.displayLabel}>Delivering to:</div>
                        <div className={styles.displayAddress}>
                          <div><strong>{selectedAddress.full_name}</strong></div>
                          <div>{selectedAddress.phone_number}</div>
                          <div style={{ marginTop: '0.5rem' }}>
                            {selectedAddress.address_line1}
                            {selectedAddress.address_line2 && <>, {selectedAddress.address_line2}</>}
                          </div>
                          <div>
                            {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postal_code}
                          </div>
                          <div>{selectedAddress.country}</div>
                        </div>
                      </div>
                    )}

                    {/* Show link to manage addresses */}
                    <div className={styles.manageAddressLink}>
                      <Link href="/account" target="_blank" style={{ fontSize: '0.875rem', color: 'var(--accent-primary)' }}>
                        Manage saved addresses
                      </Link>
                    </div>
                  </>
                )}

                {savedAddresses.length > 0 && (
                  <>
                    <h3 className={styles.sectionTitle}>Contact Information</h3>

                    <div className={styles.formGroup}>
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        style={{ borderColor: formErrors.name ? '#ff4444' : undefined }}
                      />
                      {formErrors.name && (
                        <span style={{ color: '#ff4444', fontSize: '0.85rem', marginTop: '4px' }}>
                          {formErrors.name}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={userProfile?.email || ''}
                        disabled
                        required
                        className={styles.inputDisabled}
                      />
                      <span className={styles.emailHelperText}>
                        Email from your account.{' '}
                        <Link href="/account/profile" className={styles.emailChangeLink}>
                          Change in Profile
                        </Link>{' '}
                        if needed.
                      </span>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="10-digit mobile number"
                        style={{ borderColor: formErrors.phone ? '#ff4444' : undefined }}
                      />
                      {formErrors.phone && (
                        <span style={{ color: '#ff4444', fontSize: '0.85rem', marginTop: '4px' }}>
                          {formErrors.phone}
                        </span>
                      )}
                    </div>
                  </>
                )}

                <div className={styles.checkoutButtons}>
                  <button
                    className={styles.backBtn}
                    onClick={() => setShowCheckoutForm(false)}
                  >
                    Back to Cart
                  </button>

                  <RazorpayCheckout
                    customer={customerInfo}
                    shippingAddress={shippingAddress}
                    totalAmount={totalAmount}
                    shippingCost={shipping}
                    onSuccess={handleOrderSuccess}
                    isFormValid={isFormValid}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}