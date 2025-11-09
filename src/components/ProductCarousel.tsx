'use client'

import { useState, useEffect, useRef } from 'react'
import { Product } from '@/lib/supabase'
import { AmazonProduct } from '@/types/amazon'
import { ProductImageCarousel } from './ProductImageCarousel'
import { ImageLightbox } from './ImageLightbox'
import styles from './styles/ProductCarousel.module.css'

interface BaseCarouselProps {
  title: string
  autoSlideDelay?: number // milliseconds
}

interface RegularProductCarouselProps extends BaseCarouselProps {
  type: 'regular'
  products: Product[]
  onAddToCart: (product: Product) => void
}

interface AffiliateProductCarouselProps extends BaseCarouselProps {
  type: 'affiliate'
  products: AmazonProduct[]
  defaultCurrency?: string
}

type ProductCarouselProps = RegularProductCarouselProps | AffiliateProductCarouselProps

export function ProductCarousel(props: ProductCarouselProps) {
  const { title, autoSlideDelay = 3000 } = props
  const products = props.products as Array<Product | AmazonProduct>

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxProductName, setLightboxProductName] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-slide functionality
  useEffect(() => {
    if (isPaused || products.length <= 1) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length)
    }, autoSlideDelay)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPaused, products.length, autoSlideDelay])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length)
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const openLightbox = (images: string[], index: number, productName: string) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxProductName(productName)
    setLightboxOpen(true)
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN')
  }

  if (products.length === 0) {
    return (
      <section className={styles.carouselSection}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.emptyState}>
          <p>No products available at the moment</p>
        </div>
      </section>
    )
  }

  const currentProduct = products[currentIndex]
  const isRegular = props.type === 'regular'
  const isAffiliate = props.type === 'affiliate'

  // Type guards
  const asRegularProduct = (product: Product | AmazonProduct): Product => product as Product
  const asAffiliateProduct = (product: Product | AmazonProduct): AmazonProduct => product as AmazonProduct

  return (
    <section
      className={styles.carouselSection}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.carouselContainer}>
        {/* Navigation Arrow - Previous */}
        {products.length > 1 && (
          <button
            className={`${styles.navArrow} ${styles.navArrowLeft}`}
            onClick={goToPrev}
            aria-label="Previous product"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Product Card Display */}
        <div className={styles.carouselTrack}>
          <div
            className={styles.carouselSlide}
            key={currentProduct.id}
          >
            {/* Regular Product Card */}
            {isRegular && (() => {
              const product = asRegularProduct(currentProduct)
              const productImages = product.images || []

              return (
                <div className={styles.productCard}>
                  {productImages.length > 0 && (
                    <ProductImageCarousel
                      images={productImages}
                      productName={product.name}
                      productId={product.id}
                      onImageClick={(index) => openLightbox(productImages, index, product.name)}
                      height="450px"
                    />
                  )}

                  <h3 className={styles.productName}>{product.name}</h3>

                  {product.description && (
                    <p className={styles.productDescription}>
                      {product.description.length > 120
                        ? `${product.description.substring(0, 120)}...`
                        : product.description}
                    </p>
                  )}

                  <div className={styles.productFooter}>
                    <div className={styles.priceWrapper}>
                      <span className={styles.productPrice}>₹{formatPrice(product.price)}</span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className={styles.comparePrice}>₹{formatPrice(product.compare_at_price)}</span>
                      )}
                    </div>

                    <button
                      onClick={() => props.type === 'regular' && props.onAddToCart(product)}
                      disabled={product.inventory_quantity === 0}
                      className={styles.actionBtn}
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
            })()}

            {/* Affiliate Product Card */}
            {isAffiliate && (() => {
              const product = asAffiliateProduct(currentProduct)
              const currency = props.type === 'affiliate' ? (props.defaultCurrency || '₹') : '₹'

              // Calculate discount percentage
              const calculateDiscount = () => {
                if (!product.originalPrice || !product.price) return null
                const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                return discount > 0 ? discount : null
              }

              const discount = calculateDiscount()

              return (
                <div className={styles.productCard}>
                  {product.images.length > 0 && (
                    <ProductImageCarousel
                      images={product.images}
                      productName={product.name}
                      productId={product.id}
                      onImageClick={(index) => openLightbox(product.images, index, product.name)}
                      height="450px"
                    />
                  )}

                  <h3 className={styles.productName}>{product.name}</h3>

                  {product.description && (
                    <p className={styles.productDescription}>
                      {product.description.length > 120
                        ? `${product.description.substring(0, 120)}...`
                        : product.description}
                    </p>
                  )}

                  <div className={styles.productFooter}>
                    <div className={styles.priceWrapper}>
                      {product.price ? (
                        <div className={styles.priceContainer}>
                          {product.originalPrice && (
                            <div className={styles.originalPriceRow}>
                              <span className={styles.originalPrice}>
                                {currency}{formatPrice(product.originalPrice)}
                              </span>
                              {discount && (
                                <span className={styles.discountBadge}>-{discount}%</span>
                              )}
                            </div>
                          )}
                          <span className={styles.productPrice}>
                            {currency}{formatPrice(product.price)}
                          </span>
                        </div>
                      ) : product.estimatedPrice ? (
                        <span className={styles.productPrice}>{product.estimatedPrice}</span>
                      ) : null}
                    </div>

                    <a
                      href={product.affiliateLink}
                      target="_blank"
                      rel="sponsored nofollow noreferrer"
                      className={styles.actionBtn}
                    >
                      View on Amazon
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Navigation Arrow - Next */}
        {products.length > 1 && (
          <button
            className={`${styles.navArrow} ${styles.navArrowRight}`}
            onClick={goToNext}
            aria-label="Next product"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dot Indicators */}
      {products.length > 1 && (
        <div className={styles.dotIndicators}>
          {products.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        productName={lightboxProductName}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </section>
  )
}
