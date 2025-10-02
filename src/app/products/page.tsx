'use client'

import { useProducts } from '@/hooks/useProducts'
import { useCart } from '@/contexts/CartContext'
import Image from 'next/image'

export default function ProductsPage() {
  const { data: products = [], isLoading, error } = useProducts()
  const { addItem } = useCart()

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading products...</div>
  if (error) return <div style={{ padding: '2rem' }}>Error loading products</div>

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '3rem',
        textAlign: 'center',
        color: 'var(--text-primary)'
      }}>
        Our Products
      </h1>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No products available yet.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Add some products to your Supabase database to see them here!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {products.map((product) => (
            <div key={product.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '1.5rem',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              {product.images && product.images.length > 0 && (
                <div style={{
                  width: '100%',
                  height: '240px',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    style={{
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}

              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'var(--text-primary)'
              }}>
                {product.name}
              </h3>

              {product.description && (
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  {product.description}
                </p>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--accent-primary)'
                  }}>
                    ₹{product.price}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span style={{
                      textDecoration: 'line-through',
                      color: 'var(--text-muted)',
                      marginLeft: '0.75rem',
                      fontSize: '1.1rem'
                    }}>
                      ₹{product.compare_at_price}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0],
                    maxQuantity: product.inventory_quantity || 999
                  })}
                  disabled={product.inventory_quantity === 0}
                  style={{
                    background: product.inventory_quantity === 0
                      ? 'var(--text-muted)'
                      : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    cursor: product.inventory_quantity === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'transform 0.2s ease, opacity 0.2s ease',
                    opacity: product.inventory_quantity === 0 ? 0.6 : 1
                  }}
                >
                  {product.inventory_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              {product.inventory_quantity !== undefined && (
                <p style={{
                  fontSize: '0.8rem',
                  color: product.inventory_quantity > 0 ? 'var(--success)' : 'var(--error)',
                  fontWeight: '500'
                }}>
                  {product.inventory_quantity > 0
                    ? `${product.inventory_quantity} in stock`
                    : 'Out of stock'
                  }
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}