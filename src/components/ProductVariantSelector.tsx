'use client'

import { useState } from 'react'
import styles from './ProductVariantSelector.module.css'

type ColorVariant = {
  colorId: string
  colorName: string
  colorHex: string
  images: string[]
}

type ProductVariantSelectorProps = {
  variants?: {
    colors?: ColorVariant[]
  }
  onVariantChange: (images: string[]) => void
}

export function ProductVariantSelector({ variants, onVariantChange }: ProductVariantSelectorProps) {
  const colors = variants?.colors || []
  const [selectedColorId, setSelectedColorId] = useState(colors[0]?.colorId || '')

  if (colors.length === 0) {
    return null
  }

  const handleColorChange = (colorId: string) => {
    setSelectedColorId(colorId)
    const variant = colors.find(c => c.colorId === colorId)
    if (variant) {
      onVariantChange(variant.images)
    }
  }

  return (
    <div className={styles.variantSelector}>
      <div className={styles.colorSection}>
        <label className={styles.label}>
          Color: <span className={styles.selectedValue}>{colors.find(c => c.colorId === selectedColorId)?.colorName}</span>
        </label>
        <div className={styles.colorSwatches}>
          {colors.map((color) => (
            <button
              key={color.colorId}
              className={`${styles.colorSwatch} ${selectedColorId === color.colorId ? styles.colorSwatchActive : ''}`}
              style={{ backgroundColor: color.colorHex }}
              onClick={() => handleColorChange(color.colorId)}
              title={color.colorName}
              aria-label={`Select ${color.colorName}`}
              aria-pressed={selectedColorId === color.colorId}
            >
              {selectedColorId === color.colorId && (
                <svg className={styles.checkmark} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13.3333 4L6 11.3333L2.66667 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
