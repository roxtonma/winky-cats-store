'use client'

import { CharacterOutfit, CustomizerCategory, LAYER_ORDER } from '@/types/customizer'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './styles/CharacterPreview.module.css'

interface CharacterPreviewProps {
  outfit: CharacterOutfit
  onClearSlot: (category: CustomizerCategory, index?: number) => void
}

export default function CharacterPreview({ outfit, onClearSlot }: CharacterPreviewProps) {
  const layers = [
    { slot: outfit.shoes, category: 'shoes' as CustomizerCategory, order: LAYER_ORDER.SHOES, label: 'Shoes' },
    { slot: outfit.bottoms, category: 'bottoms' as CustomizerCategory, order: LAYER_ORDER.BOTTOMS, label: 'Bottoms' },
    { slot: outfit.innerTops, category: 'inner-tops' as CustomizerCategory, order: LAYER_ORDER.INNER_TOPS, label: 'Inner Top' },
    { slot: outfit.outerTops, category: 'outer-tops' as CustomizerCategory, order: LAYER_ORDER.OUTER_TOPS, label: 'Outer Top' },
    { slot: outfit.head, category: 'head' as CustomizerCategory, order: LAYER_ORDER.HEAD, label: 'Head' },
  ]

  const hasAnyItem = layers.some(l => l.slot.product) || outfit.accessories.length > 0

  return (
    <div className={styles.container}>
      <div className={styles.previewArea}>
        {!hasAnyItem && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👕</div>
            <p>Start building your outfit</p>
            <span>Select items from categories on the right</span>
          </div>
        )}

        <div className={styles.layerCanvas}>
          <AnimatePresence>
            {layers.map(({ slot, category, order, label }) => (
              slot.product && (
                <motion.div
                  key={`${category}-${slot.product.id}`}
                  className={styles.layer}
                  style={{ zIndex: order }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={slot.variant?.selectedImage || slot.product.images[0]}
                    alt={slot.product.name}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="400px"
                    priority
                  />
                  <button
                    className={styles.removeButton}
                    onClick={() => onClearSlot(category)}
                    aria-label={`Remove ${label}`}
                  >
                    ✕
                  </button>
                </motion.div>
              )
            ))}

            {outfit.accessories.map((accessory, index) => (
              accessory.product && (
                <motion.div
                  key={`accessory-${accessory.product.id}-${index}`}
                  className={styles.layer}
                  style={{ zIndex: LAYER_ORDER.ACCESSORIES + index }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={accessory.variant?.selectedImage || accessory.product.images[0]}
                    alt={accessory.product.name}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="400px"
                  />
                  <button
                    className={styles.removeButton}
                    onClick={() => onClearSlot('accessories', index)}
                    aria-label={`Remove accessory ${index + 1}`}
                  >
                    ✕
                  </button>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      </div>

      {hasAnyItem && (
        <div className={styles.outfitSummary}>
          <h3>Your Outfit</h3>
          <div className={styles.itemsList}>
            {layers.map(({ slot, label }) => (
              slot.product && (
                <div key={label} className={styles.summaryItem}>
                  <span className={styles.itemLabel}>{label}</span>
                  <span className={styles.itemName}>{slot.product.name}</span>
                </div>
              )
            ))}
            {outfit.accessories.map((acc, i) => (
              acc.product && (
                <div key={`acc-${i}`} className={styles.summaryItem}>
                  <span className={styles.itemLabel}>Accessory {i + 1}</span>
                  <span className={styles.itemName}>{acc.product.name}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
