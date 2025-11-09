'use client'

import { CharacterOutfit, CustomizerCategory } from '@/types/customizer'
import Image from 'next/image'
import styles from './styles/SelectedItemsThumbnails.module.css'

interface SelectedItemsThumbnailsProps {
  outfit: CharacterOutfit
  onRemoveItem: (category: CustomizerCategory, index?: number) => void
}

export default function SelectedItemsThumbnails({ outfit, onRemoveItem }: SelectedItemsThumbnailsProps) {
  const allItems = [
    { item: outfit.head, category: 'head' as CustomizerCategory, label: 'Head', index: undefined },
    { item: outfit.innerTops, category: 'inner-tops' as CustomizerCategory, label: 'Inner Top', index: undefined },
    { item: outfit.outerTops, category: 'outer-tops' as CustomizerCategory, label: 'Outer Top', index: undefined },
    { item: outfit.bottoms, category: 'bottoms' as CustomizerCategory, label: 'Bottoms', index: undefined },
    { item: outfit.shoes, category: 'shoes' as CustomizerCategory, label: 'Shoes', index: undefined },
    ...outfit.accessories.map((acc, idx) => ({
      item: acc,
      category: 'accessories' as CustomizerCategory,
      label: `Accessory ${idx + 1}`,
      index: idx,
    })),
  ].filter(({ item }) => item.product !== null)

  if (allItems.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Selected Items</h3>
        <div className={styles.emptyState}>
          <p>No items selected</p>
          <span>Browse categories to add items</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Selected Items ({allItems.length})</h3>
      <div className={styles.grid}>
        {allItems.map(({ item, category, label, index }) => (
          <div key={`${category}-${index || 0}`} className={styles.thumbnail}>
            <div className={styles.imageWrapper}>
              <Image
                src={item.variant?.selectedImage || item.product!.images[0]}
                alt={item.product!.name}
                fill
                sizes="100px"
                style={{ objectFit: 'cover' }}
              />
              <button
                className={styles.removeButton}
                onClick={() => onRemoveItem(category, index)}
                aria-label={`Remove ${label}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className={styles.itemLabel}>{label}</p>
            <p className={styles.itemName}>{item.product!.name}</p>
            {item.product!.price && (
              <p className={styles.itemPrice}>₹{item.product!.price}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
