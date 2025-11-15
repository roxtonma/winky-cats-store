'use client'

import { useProducts } from '@/hooks/useProducts'
import { useCart } from '@/contexts/CartContext'
import styles from './products.module.css'
import { ProductSkeletonGrid } from '@/components/ProductSkeleton'
import { useSearchParams, useRouter } from 'next/navigation'
import { useMemo, Suspense, useState, useEffect, useRef, lazy } from 'react'
import { FilterSidebar, FilterState } from '@/components/FilterSidebar'
import { ProductImageCarousel } from '@/components/ProductImageCarousel'
import { useCategories } from '@/hooks/useCategories'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ScrollReveal } from '@/components/ScrollReveal'
import type { Product } from '@/lib/supabase'

// Lazy load heavy components
const ImageLightbox = lazy(() => import('@/components/ImageLightbox').then(mod => ({ default: mod.ImageLightbox })))
const ProductCustomizationModal = lazy(() => import('@/components/ProductCustomizationModal').then(mod => ({ default: mod.ProductCustomizationModal })))

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryFilter = searchParams.get('category')
  const { addItem } = useCart()

  // Detect mobile viewport
  const isMobile = useMediaQuery('(max-width: 1024px)')

  // Fetch categories
  const { data: categories = [] } = useCategories()

  // Filter state - initialize first
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    selectedTags: [],
    selectedCategory: categoryFilter
  })

  // Update filter state when URL category changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      selectedCategory: categoryFilter
    }))
  }, [categoryFilter])

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxProductName, setLightboxProductName] = useState('')

  // Track current images for each product (for variant switching)
  const [productImages] = useState<Record<string, string[]>>({})

  // Customization modal state
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Handle filter changes - update URL when category changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)

    // Update URL when category changes
    if (newFilters.selectedCategory !== filters.selectedCategory) {
      const params = new URLSearchParams(searchParams.toString())
      if (newFilters.selectedCategory) {
        params.set('category', newFilters.selectedCategory)
      } else {
        params.delete('category')
      }
      router.push(`/products?${params.toString()}`)
    }
  }

  // Use products hook with pagination and server-side filtering
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useProducts({
    category: filters.selectedCategory || undefined,
    minPrice: filters.priceRange[0],
    maxPrice: filters.priceRange[1],
    tags: filters.selectedTags,
    limit: 20
  })

  // Flatten all pages into a single products array
  const products = useMemo(() => {
    return data?.pages.flatMap(page => page.products) || []
  }, [data])

  // Get total count from first page
  const totalCount = data?.pages[0]?.pagination.total || 0

  // Calculate max price and available tags - now we need to fetch separately or use initial data
  // For now, we'll set a high default and update based on actual data
  const { maxPrice, availableTags } = useMemo(() => {
    if (!products.length) return { maxPrice: 10000, availableTags: [] }

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

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const openLightbox = (images: string[], index: number, productName: string) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxProductName(productName)
    setLightboxOpen(true)
  }

  const openCustomizationModal = (product: Product) => {
    setSelectedProduct(product)
    setCustomizationModalOpen(true)
  }

  const handleAddToCartFromModal = (product: Product, selectedVariant: { size?: string; colorId?: string; colorName?: string; images?: string[] }) => {
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

  if (error) return (
    <div className={styles.container}>
      <div className={styles.error}>
        <p>Error loading products</p>
        <p>Please try refreshing the page</p>
      </div>
    </div>
  )

  // Get category display name
  const currentCategory = categories.find(cat => cat.slug === filters.selectedCategory)
  const categoryName = currentCategory?.name || null

  return (
    <div className={styles.container}>
      <ScrollReveal delay={0.1}>
        <h1 className={styles.title}>
          {categoryName ? `${categoryName}` : 'Our Products'}
        </h1>
      </ScrollReveal>

      <div className={styles.contentWrapper}>
        {isMobile ? (
          <aside className={styles.filterSection}>
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              availableTags={availableTags}
              maxPrice={maxPrice}
              isMobileOpen={isMobileFilterOpen}
              onMobileClose={() => setIsMobileFilterOpen(false)}
              categories={categories}
            />
          </aside>
        ) : (
          <ScrollReveal delay={0.15}>
            <aside className={styles.filterSection}>
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                availableTags={availableTags}
                maxPrice={maxPrice}
                isMobileOpen={isMobileFilterOpen}
                onMobileClose={() => setIsMobileFilterOpen(false)}
                categories={categories}
              />
            </aside>
          </ScrollReveal>
        )}

        <main className={styles.productsSection}>
          {/* Category Badge */}
          {categoryName && (
            <div className={styles.categoryBadge}>
              <span className={styles.badgeText}>{categoryName}</span>
              <button
                className={styles.clearCategoryBtn}
                onClick={() => handleFilterChange({ ...filters, selectedCategory: null })}
                aria-label="Clear category filter"
              >
                ✕
              </button>
            </div>
          )}

          {isLoading ? (
            <div className={styles.productsGrid}>
              <ProductSkeletonGrid count={6} />
            </div>
          ) : products.length === 0 ? (
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
                  Showing {products.length} of {totalCount} products
                </p>
              </div>
              <ScrollReveal delay={0.2}>
                <div className={styles.productsGrid}>
                  {products.map((product) => {
                  const currentImages = getProductImages(product)
                  return (
                    <div key={product.id} className={styles.productCard}>
                      {currentImages.length > 0 && (
                        <ProductImageCarousel
                          images={currentImages}
                          productName={product.name}
                          productId={product.id}
                          onImageClick={(index) => openLightbox(currentImages, index, product.name)}
                          height="400px"
                        />
                      )}

                      <h3
                        className={styles.productName}
                        onClick={() => openCustomizationModal(product)}
                        style={{ cursor: 'pointer' }}
                      >
                        {product.name}
                      </h3>

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
              </ScrollReveal>

              {/* Infinite scroll trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className={styles.loadMore}>
                  {isFetchingNextPage ? (
                    <ProductSkeletonGrid count={3} />
                  ) : (
                    <button onClick={() => fetchNextPage()} className={styles.loadMoreBtn}>
                      Load More
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Image Lightbox - lazy loaded */}
      {lightboxOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <ImageLightbox
            images={lightboxImages}
            initialIndex={lightboxIndex}
            productName={lightboxProductName}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </Suspense>
      )}

      {/* Product Customization Modal - lazy loaded */}
      {customizationModalOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <ProductCustomizationModal
            product={selectedProduct}
            isOpen={customizationModalOpen}
            onClose={() => setCustomizationModalOpen(false)}
            onAddToCart={handleAddToCartFromModal}
          />
        </Suspense>
      )}
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