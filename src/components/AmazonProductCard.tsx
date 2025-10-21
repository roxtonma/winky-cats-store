'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AmazonProduct } from '@/types/amazon'
import styles from './styles/AmazonProductCard.module.css'

interface AmazonProductCardProps {
  product: AmazonProduct
}

export function AmazonProductCard({ product }: AmazonProductCardProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  return (
    <>
      <div className={styles.card}>
        <div
          className={styles.imageWrapper}
          onClick={() => setIsLightboxOpen(true)}
          style={{ cursor: 'pointer' }}
        >
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.image}
          />
        </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>

        {/* Uncomment to display tags on product cards */}
        {/* {product.tags && product.tags.length > 0 && (
          <div className={styles.tags}>
            {product.tags.map(tag => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )} */}

        <div className={styles.footer}>
          {product.estimatedPrice && (
            <span className={styles.price}>{product.estimatedPrice}</span>
          )}
          <a
            href={product.affiliateLink}
            target="_blank"
            rel="sponsored nofollow noreferrer"
            className={styles.button}
          >
            View on Amazon
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.buttonIcon}
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
    </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className={styles.lightbox}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.lightboxClose}
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className={styles.lightboxImage}>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={800}
                height={800}
                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
              />
            </div>
            <p className={styles.lightboxCaption}>{product.name}</p>
          </div>
        </div>
      )}
    </>
  )
}
