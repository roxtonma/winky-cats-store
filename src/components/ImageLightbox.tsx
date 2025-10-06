'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './styles/ImageLightbox.module.css'
import LoadingSpinner from './LoadingSpinner'

type ImageLightboxProps = {
  images: string[]
  initialIndex: number
  productName: string
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex, productName, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  // Reset transition state after image change
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, onClose])

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index))
  }

  const goToNext = () => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goToPrev = () => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Touch swipe handling
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return

    const currentTouch = e.targetTouches[0].clientX
    const diff = currentTouch - touchStart

    setTouchEnd(currentTouch)
    setDragOffset(diff)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false)
      setDragOffset(0)
      return
    }

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe || isRightSwipe) {
      setIsTransitioning(true)
      if (isLeftSwipe) {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      } else {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
      }
    }

    // Reset drag state
    setIsDragging(false)
    setDragOffset(0)
  }

  if (!isOpen) return null

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <button className={styles.closeButton} onClick={onClose} aria-label="Close lightbox">
        &times;
      </button>

      <div
        className={styles.lightboxContent}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Navigation Arrows */}
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

        {/* Image Container */}
        <div className={styles.carouselWrapper}>
          <div
            className={styles.carouselTrack}
            style={{
              transform: `translateX(calc(-33.333% + ${dragOffset}px))`,
              transition: (isDragging || !isTransitioning) ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Previous Image */}
            <div className={styles.carouselSlide}>
              {images.length > 1 && (
                <div className={styles.slideImageWrapper}>
                  {!loadedImages.has((currentIndex - 1 + images.length) % images.length) && (
                    <div className={styles.loadingOverlay}>
                      <LoadingSpinner />
                    </div>
                  )}
                  <Image
                    src={images[(currentIndex - 1 + images.length) % images.length]}
                    alt={`${productName} - Previous image`}
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'contain' }}
                    onLoad={() => handleImageLoad((currentIndex - 1 + images.length) % images.length)}
                  />
                </div>
              )}
            </div>

            {/* Current Image */}
            <div className={styles.carouselSlide}>
              <div className={styles.slideImageWrapper}>
                {!loadedImages.has(currentIndex) && (
                  <div className={styles.loadingOverlay}>
                    <LoadingSpinner />
                  </div>
                )}
                <Image
                  src={images[currentIndex]}
                  alt={`${productName} - Image ${currentIndex + 1}`}
                  fill
                  sizes="100vw"
                  style={{ objectFit: 'contain' }}
                  onLoad={() => handleImageLoad(currentIndex)}
                  priority
                />
              </div>
            </div>

            {/* Next Image */}
            <div className={styles.carouselSlide}>
              {images.length > 1 && (
                <div className={styles.slideImageWrapper}>
                  {!loadedImages.has((currentIndex + 1) % images.length) && (
                    <div className={styles.loadingOverlay}>
                      <LoadingSpinner />
                    </div>
                  )}
                  <Image
                    src={images[(currentIndex + 1) % images.length]}
                    alt={`${productName} - Next image`}
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'contain' }}
                    onLoad={() => handleImageLoad((currentIndex + 1) % images.length)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image Counter & Thumbnails */}
        <div className={styles.bottomBar}>
          <div className={styles.imageCounter}>
            {currentIndex + 1} / {images.length}
          </div>

          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className={styles.thumbnailsContainer}>
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`${styles.thumbnail} ${index === currentIndex ? styles.thumbnailActive : ''}`}
                  aria-label={`Go to image ${index + 1}`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="80px"
                    style={{ objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
