'use client'

import { useState } from 'react'
import { AmazonProduct } from '@/types/amazon'
import { ProductImageCarousel } from './ProductImageCarousel'
import { ImageLightbox } from './ImageLightbox'
import styles from './styles/AmazonProductCard.module.css'

interface AmazonProductCardProps {
  product: AmazonProduct
  defaultCurrency?: string
}

export function AmazonProductCard({ product, defaultCurrency = '₹' }: AmazonProductCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // Format price with Indian number system (commas)
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN')
  }

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (!product.originalPrice || !product.price) return null
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    return discount > 0 ? discount : null
  }

  const discount = calculateDiscount()
  const currency = product.currency || defaultCurrency

  return (
    <>
      <div className={styles.productCard}>
        {product.images.length > 0 && (
          <ProductImageCarousel
            images={product.images}
            productName={product.name}
            productId={product.id}
            onImageClick={openLightbox}
          />
        )}

        <h3 className={styles.productName}>{product.name}</h3>

        {product.description && (
          <p className={styles.productDescription}>{product.description}</p>
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
            className={styles.viewOnAmazonBtn}
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

      {/* Image Lightbox */}
      <ImageLightbox
        images={product.images}
        initialIndex={lightboxIndex}
        productName={product.name}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
