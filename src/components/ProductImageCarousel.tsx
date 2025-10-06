'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './styles/ProductImageCarousel.module.css'
import LoadingSpinner from './LoadingSpinner'

type ProductImageCarouselProps = {
  images: string[]
  productName: string
  productId: string
  onImageClick: (index: number) => void
  height?: string
}

export function ProductImageCarousel({ images, productName, productId, onImageClick, height }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex(index)
  }

  if (!images || images.length === 0) {
    return (
      <div className={styles.carouselWrapper}>
        <div className={styles.noImage}>No image available</div>
      </div>
    )
  }

  return (
    <div className={styles.carouselWrapper} data-product-id={productId} style={height ? { height } : undefined}>
      <div
        className={styles.imageContainer}
        onClick={() => onImageClick(currentIndex)}
        role="button"
        tabIndex={0}
        aria-label={`View full size image of ${productName}`}
      >
        {!loadedImages.has(currentIndex) && (
          <div className={styles.imageLoadingOverlay}>
            <LoadingSpinner />
          </div>
        )}
        <Image
          src={images[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
          onLoad={() => handleImageLoad(currentIndex)}
          priority={currentIndex === 0}
        />

        {/* Navigation Arrows - Only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className={`${styles.navButton} ${styles.navButtonPrev}`}
              aria-label="Previous image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={goToNext}
              className={`${styles.navButton} ${styles.navButtonNext}`}
              aria-label="Next image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dots Navigation - Only show if multiple images */}
      {images.length > 1 && (
        <div className={styles.dotsContainer}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(index, e)}
              className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
              aria-label={`Go to image ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
      )}
    </div>
  )
}
