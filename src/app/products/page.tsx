'use client'

import { useProducts } from '@/hooks/useProducts'
import { useCart } from '@/contexts/CartContext'
import styles from './products.module.css'
import { ProductSkeletonGrid } from '@/components/ProductSkeleton'
import { useSearchParams } from 'next/navigation'
import { useMemo, Suspense, useState } from 'react'
import { FilterSidebar, FilterState } from '@/components/FilterSidebar'
import { ProductImageCarousel } from '@/components/ProductImageCarousel'
import { ImageLightbox } from '@/components/ImageLightbox'
import { ProductVariantSelector } from '@/components/ProductVariantSelector'
import { ProductCustomizationModal } from '@/components/ProductCustomizationModal'
import type { Product } from '@/lib/supabase'

function ProductsContent() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get('category')

  // Build API URL with category filter
  const apiUrl = categoryFilter ? `/api/products?category=${categoryFilter}` : '/api/products'

  const { data: products = [], isLoading, error } = useProducts(apiUrl)
  const { addItem } = useCart()

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxProductName, setLightboxProductName] = useState('')

  // Track current images for each product (for variant switching)
  const [productImages, setProductImages] = useState<Record<string, string[]>>({})

  // Customization modal state
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const openLightbox = (images: string[], index: number, productName: string) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxProductName(productName)
    setLightboxOpen(true)
  }

  const handleVariantChange = (productId: string, newImages: string[]) => {
    setProductImages(prev => ({
      ...prev,
      [productId]: newImages
    }))
  }

  const openCustomizationModal = (product: Product) => {
    setSelectedProduct(product)
    setCustomizationModalOpen(true)
  }

  const handleAddToCartFromModal = (product: Product, selectedVariant: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedVariant.images?.[0] || product.images?.[0],
      maxQuantity: product.inventory_quantity || 999,
      variant: {
        size: selectedVariant.size,
        color: selectedVariant.colorId,
        colorName: selectedVariant.colorName
      }
    })
  }

  const getProductImages = (product: Product) => {
    return productImages[product.id] || product.images || []
  }

  // Calculate max price and available tags from products
  const { maxPrice, availableTags } = useMemo(() => {
    if (!products.length) return { maxPrice: 1000, availableTags: [] }

    const max = Math.max(...products.map((p: Product) => p.price))
    const tagsSet = new Set<string>()
    products.forEach((p: Product) => {
      p.tags?.forEach(tag => tagsSet.add(tag))
    })

    return {
      maxPrice: Math.ceil(max / 100) * 100, // Round up to nearest 100
      availableTags: Array.from(tagsSet).sort()
    }
  }, [products])

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, maxPrice],
    inStock: false,
    selectedTags: []
  })

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Update price range when maxPrice changes
  useMemo(() => {
    setFilters(prev => ({
      ...prev,
      priceRange: [prev.priceRange[0], maxPrice]
    }))
  }, [maxPrice])

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      // Price filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      // Stock filter
      if (filters.inStock && product.inventory_quantity === 0) {
        return false
      }

      // Tags filter
      if (filters.selectedTags.length > 0) {
        const productTags = product.tags || []
        const hasMatchingTag = filters.selectedTags.some(tag => productTags.includes(tag))
        if (!hasMatchingTag) return false
      }

      return true
    })
  }, [products, filters])

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

      <div className={styles.contentWrapper}>
        <aside className={styles.filterSection}>
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilters}
            availableTags={availableTags}
            maxPrice={maxPrice}
            isMobileOpen={isMobileFilterOpen}
            onMobileClose={() => setIsMobileFilterOpen(false)}
          />
        </aside>

        <main className={styles.productsSection}>
          {isLoading ? (
            <div className={styles.productsGrid}>
              <ProductSkeletonGrid count={6} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No products found{categoryName ? ` in ${categoryName}` : ''} matching your filters.</p>
              <p>Try adjusting your filters to see more products.</p>
            </div>
          ) : (
            <>
              <div className={styles.resultsHeader}>
                <button
                  className={styles.mobileFilterBtn}
                  onClick={() => setIsMobileFilterOpen(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 5.83333H6.66667M6.66667 5.83333C6.66667 7.214 7.78595 8.33333 9.16667 8.33333C10.5474 8.33333 11.6667 7.214 11.6667 5.83333M6.66667 5.83333C6.66667 4.45267 7.78595 3.33333 9.16667 3.33333C10.5474 3.33333 11.6667 4.45267 11.6667 5.83333M11.6667 5.83333H17.5M2.5 14.1667H8.33333M8.33333 14.1667C8.33333 15.5474 9.45262 16.6667 10.8333 16.6667C12.214 16.6667 13.3333 15.5474 13.3333 14.1667M8.33333 14.1667C8.33333 12.786 9.45262 11.6667 10.8333 11.6667C12.214 11.6667 13.3333 12.786 13.3333 14.1667M13.3333 14.1667H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Filters
                </button>
                <p className={styles.resultCount}>
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>
              <div className={styles.productsGrid}>
                {filteredProducts.map((product) => {
                  const currentImages = getProductImages(product)
                  return (
                    <div key={product.id} className={styles.productCard}>
                      {currentImages.length > 0 && (
                        <ProductImageCarousel
                          images={currentImages}
                          productName={product.name}
                          productId={product.id}
                          onImageClick={(index) => openLightbox(currentImages, index, product.name)}
                        />
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
                        onClick={() => openCustomizationModal(product)}
                        disabled={product.inventory_quantity === 0}
                        className={styles.addToCartBtn}
                        aria-label={`View ${product.name} options`}
                      >
                        {product.inventory_quantity === 0 ? 'Out of Stock' : 'Add to cart'}
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
                  )
                })}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        productName={lightboxProductName}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Product Customization Modal */}
      <ProductCustomizationModal
        product={selectedProduct}
        isOpen={customizationModalOpen}
        onClose={() => setCustomizationModalOpen(false)}
        onAddToCart={handleAddToCartFromModal}
      />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <h1 className={styles.title}>Our Products</h1>
        <div className={styles.productsGrid}>
          <ProductSkeletonGrid count={6} />
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}