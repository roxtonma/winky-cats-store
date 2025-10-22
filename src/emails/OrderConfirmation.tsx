import * as React from 'react'

interface OrderItem {
  name: string
  quantity: number
  price: number
  variant?: {
    size?: string
    colorName?: string
  }
}

interface ShippingAddress {
  name: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
}

interface OrderConfirmationEmailProps {
  orderNumber: string
  customerName: string
  items: OrderItem[]
  total: number
  shippingAddress: ShippingAddress
}

export default function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  total,
  shippingAddress,
}: OrderConfirmationEmailProps) {
  return (
    <html>
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f9fafb', margin: 0, padding: 0 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '40px 20px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '3px solid #FF69B4', paddingBottom: '20px' }}>
            <h1 style={{ color: '#FF69B4', fontSize: '32px', margin: 0, fontWeight: 700 }}>Winky Cats Store</h1>
            <p style={{ color: '#718096', fontSize: '14px', margin: '8px 0 0 0' }}>Thank you for your order!</p>
          </div>

          {/* Order Confirmation */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#1a202c', fontSize: '24px', marginBottom: '16px' }}>Order Confirmed</h2>
            <p style={{ color: '#4a5568', fontSize: '16px', lineHeight: '1.6', marginBottom: '12px' }}>
              Hi {customerName},
            </p>
            <p style={{ color: '#4a5568', fontSize: '16px', lineHeight: '1.6', marginBottom: '12px' }}>
              We&apos;ve received your order and are getting it ready. We&apos;ll notify you when it ships.
            </p>
            <div style={{ backgroundColor: '#f7fafc', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
              <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>Order Number</p>
              <p style={{ margin: '4px 0 0 0', color: '#1a202c', fontSize: '20px', fontWeight: 600 }}>#{orderNumber}</p>
            </div>
          </div>

          {/* Order Items */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#1a202c', fontSize: '18px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
              Order Details
            </h3>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f7fafc' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#1a202c', fontSize: '16px', fontWeight: 500 }}>
                    {item.name}
                    {item.variant && (item.variant.size || item.variant.colorName) && (
                      <span style={{ color: '#718096', fontSize: '14px', fontWeight: 400 }}>
                        {' '}({[item.variant.size, item.variant.colorName].filter(Boolean).join(', ')})
                      </span>
                    )}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '14px' }}>
                    Qty: {item.quantity}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#1a202c', fontSize: '16px', fontWeight: 600 }}>
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', marginTop: '8px', borderTop: '2px solid #1a202c' }}>
              <p style={{ margin: 0, color: '#1a202c', fontSize: '18px', fontWeight: 700 }}>Total</p>
              <p style={{ margin: 0, color: '#FF69B4', fontSize: '20px', fontWeight: 700 }}>₹{total.toLocaleString()}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#1a202c', fontSize: '18px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
              Shipping Address
            </h3>
            <div style={{ backgroundColor: '#f7fafc', padding: '16px', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#1a202c', fontSize: '16px', fontWeight: 500 }}>
                {shippingAddress.name}
              </p>
              <p style={{ margin: '4px 0', color: '#4a5568', fontSize: '14px', lineHeight: '1.6' }}>
                {shippingAddress.addressLine1}
                {shippingAddress.addressLine2 && <br />}
                {shippingAddress.addressLine2}
              </p>
              <p style={{ margin: '4px 0', color: '#4a5568', fontSize: '14px' }}>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p style={{ margin: '4px 0', color: '#4a5568', fontSize: '14px' }}>
                {shippingAddress.country}
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#4a5568', fontSize: '14px' }}>
                Phone: {shippingAddress.phone}
              </p>
            </div>
          </div>

          {/* Support Info */}
          <div style={{ backgroundColor: '#fff5f7', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#1a202c', fontSize: '16px', fontWeight: 600 }}>
              Need Help?
            </p>
            <p style={{ margin: 0, color: '#4a5568', fontSize: '14px', lineHeight: '1.6' }}>
              If you have any questions about your order, please contact us through email. We&apos;re here to help!
            </p>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ color: '#718096', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
              This is an automated email, please do not reply to this message.
            </p>
            <p style={{ color: '#718096', fontSize: '12px', lineHeight: '1.6', margin: '8px 0 0 0' }}>
              © {new Date().getFullYear()} Winky Cats Store. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
