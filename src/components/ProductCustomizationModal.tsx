'use client'

import { useState, useEffect } from 'react'
import styles from './styles/ProductCustomizationModal.module.css'
import { ProductVariantSelector } from './ProductVariantSelector'
import { ProductImageCarousel } from './ProductImageCarousel'
import { TryOnModal } from './TryOnModal'
import type { Product } from '@/lib/supabase'

type ProductCustomizationModalProps = {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product, selectedVariant: SelectedVariant) => void
}

type SelectedVariant = {
  colorId?: string
  colorName?: string
  size?: string
  images?: string[]
}

export function ProductCustomizationModal({
  product,
  isOpen,
  onClose,
  onAddToCart
}: ProductCustomizationModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant>({})
  const [currentImages, setCurrentImages] = useState<string[]>([])
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false)

  // Initialize defaults when modal opens with a new product
  useEffect(() => {
    if (product && isOpen) {
      const colors = product.variants?.colors || []
      const sizes = product.variants?.sizes || []

      setSelectedVariant({
        colorId: colors[0]?.colorId,
        colorName: colors[0]?.colorName,
        size: sizes[0],
        images: colors[0]?.images || product.images
      })
      setCurrentImages(colors[0]?.images || product.images || [])
    }
  }, [product, isOpen])

  if (!isOpen || !product) return null

  const handleVariantChange = (newImages: string[]) => {
    const colors = product.variants?.colors || []
    const newColor = colors.find(c => c.images === newImages)

    setSelectedVariant(prev => ({
      ...prev,
      colorId: newColor?.colorId,
      colorName: newColor?.colorName,
      images: newImages
    }))
    setCurrentImages(newImages)
  }

  const handleSizeChange = (size: string) => {
    setSelectedVariant(prev => ({ ...prev, size }))
  }

  const handleAddToCart = () => {
    onAddToCart(product, selectedVariant)
    onClose()
  }

  const hasVariants = product.variants?.colors || product.variants?.sizes

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        <div className={styles.content}>
          {/* Product Image Carousel */}
          {currentImages.length > 0 && (
            <div className={styles.imageSection}>
              <ProductImageCarousel
                images={currentImages}
                productName={product.name}
                productId={product.id}
                onImageClick={() => {}}
                height="400px"
              />
            </div>
          )}

          {/* Product Details */}
          <div className={styles.detailsSection}>
            <h2 className={styles.productName}>{product.name}</h2>

            {product.description && (
              <p className={styles.productDescription}>{product.description}</p>
            )}

            <div className={styles.priceWrapper}>
              <span className={styles.productPrice}>₹{product.price}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className={styles.comparePrice}>₹{product.compare_at_price}</span>
              )}
            </div>

            {/* Variants Section */}
            {hasVariants && (
              <div className={styles.variantsSection}>
                {/* Color Selector */}
                {product.variants?.colors && (
                  <ProductVariantSelector
                    variants={product.variants}
                    onVariantChange={handleVariantChange}
                  />
                )}

                {/* Size Selector */}
                {product.variants?.sizes && product.variants.sizes.length > 0 && (
                  <div className={styles.sizeSection}>
                    <label className={styles.label}>
                      Size: <span className={styles.selectedValue}>{selectedVariant.size || product.variants.sizes[0]}</span>
                    </label>
                    <div className={styles.sizeButtons}>
                      {product.variants.sizes.map((size) => (
                        <button
                          key={size}
                          className={`${styles.sizeButton} ${
                            (selectedVariant.size || product.variants?.sizes?.[0]) === size ? styles.sizeButtonActive : ''
                          }`}
                          onClick={() => handleSizeChange(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock Info */}
            {product.inventory_quantity !== undefined && (
              <p className={`${styles.stockInfo} ${product.inventory_quantity > 0 ? styles.inStock : styles.outOfStock}`}>
                {product.inventory_quantity > 0
                  ? `${product.inventory_quantity} in stock`
                  : 'Out of stock'
                }
              </p>
            )}

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                onClick={() => setIsTryOnModalOpen(true)}
                className={styles.tryOnBtn}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Try On
              </button>

              <button
                onClick={handleAddToCart}
                disabled={product.inventory_quantity === 0}
                className={styles.addToCartBtn}
              >
                {product.inventory_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>

        {/* Try On Modal */}
        <TryOnModal
          isOpen={isTryOnModalOpen}
          onClose={() => setIsTryOnModalOpen(false)}
          productName={product.name}
          productImages={currentImages}
          selectedColor={selectedVariant.colorName}
        />
      </div>
    </div>
  )
}
