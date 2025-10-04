'use client'

import { useProducts } from '@/hooks/useProducts'
import { useCart } from '@/contexts/CartContext'
import Image from 'next/image'
import styles from './products.module.css'
import { ProductSkeletonGrid } from '@/components/ProductSkeleton'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get('category')

  // Build API URL with category filter
  const apiUrl = categoryFilter ? `/api/products?category=${categoryFilter}` : '/api/products'

  const { data: products = [], isLoading, error } = useProducts(apiUrl)
  const { addItem } = useCart()

  // Products already filtered by API
  const filteredProducts = products

  if (error) return (
    <div className={styles.container}>
      <div className={styles.error}>
        <p>Error loading products</p>
        <p>Please try refreshing the page</p>
      </div>
    </div>
  )

  // Get category display name
  const categoryName = categoryFilter
    ? categoryFilter.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : null

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {categoryName ? `${categoryName}` : 'Our Products'}
      </h1>

      {isLoading ? (
        <div className={styles.productsGrid}>
          <ProductSkeletonGrid count={6} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No products found{categoryName ? ` in ${categoryName}` : ''}.</p>
          <p>Add some products to your Supabase database to see them here!</p>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <div key={product.id} className={styles.productCard}>
              {product.images && product.images.length > 0 && (
                <div className={styles.productImageWrapper}>
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

              <h3 className={styles.productName}>{product.name}</h3>

              {product.description && (
                <p className={styles.productDescription}>{product.description}</p>
              )}

              <div className={styles.productFooter}>
                <div className={styles.priceWrapper}>
                  <span className={styles.productPrice}>₹{product.price}</span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className={styles.comparePrice}>₹{product.compare_at_price}</span>
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
                  className={styles.addToCartBtn}
                  aria-label={`Add ${product.name} to cart`}
                >
                  {product.inventory_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              {product.inventory_quantity !== undefined && (
                <p className={`${styles.stockInfo} ${product.inventory_quantity > 0 ? styles.inStock : styles.outOfStock}`}>
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