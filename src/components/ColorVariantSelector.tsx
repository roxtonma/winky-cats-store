'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './styles/ColorVariantSelector.module.css'

type ColorVariant = {
  name: string
  hex: string
}

type ColorVariantSelectorProps = {
  mockupImage: string
  variants: ColorVariant[]
  onColorChange?: (color: ColorVariant) => void
}

export function ColorVariantSelector({ mockupImage, variants, onColorChange }: ColorVariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState(variants[0])

  const handleColorSelect = (color: ColorVariant) => {
    setSelectedColor(color)
    onColorChange?.(color)
  }

  return (
    <div className={styles.container}>
      {/* Mockup with color background */}
      <div className={styles.mockupContainer}>
        <div
          className={styles.colorLayer}
          style={{ backgroundColor: selectedColor.hex }}
          aria-hidden="true"
        />
        <div className={styles.mockupWrapper}>
          <Image
            src={mockupImage}
            alt="Product mockup"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      </div>

      {/* Color Swatches */}
      <div className={styles.swatchesContainer}>
        <p className={styles.colorLabel}>Color: <span className={styles.colorName}>{selectedColor.name}</span></p>
        <div className={styles.swatches}>
          {variants.map((variant) => (
            <button
              key={variant.name}
              onClick={() => handleColorSelect(variant)}
              className={`${styles.swatch} ${selectedColor.name === variant.name ? styles.swatchActive : ''}`}
              style={{ backgroundColor: variant.hex }}
              aria-label={`Select ${variant.name} color`}
              title={variant.name}
            >
              {selectedColor.name === variant.name && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3332 4L5.99984 11.3333L2.6665 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
