'use client'

import { useState } from 'react'
import { CharacterOutfit, CustomizerCategory, CustomizerProduct } from '@/types/customizer'
import SelectedItemsThumbnails from '@/components/SelectedItemsThumbnails'
import MultiItemTryOnPreview from '@/components/MultiItemTryOnPreview'
import CategoryProductSelector from '@/components/CategoryProductSelector'
import styles from './build-an-outfit.module.css'

export default function BuildAnOutfitPage() {
  const [activeCategory, setActiveCategory] = useState<CustomizerCategory>('inner-tops')

  const [outfit, setOutfit] = useState<CharacterOutfit>({
    head: { product: null },
    innerTops: { product: null },
    outerTops: { product: null },
    bottoms: { product: null },
    shoes: { product: null },
    accessories: [],
  })

  const handleProductSelect = (category: CustomizerCategory, product: CustomizerProduct) => {
    if (category === 'accessories') {
      setOutfit(prev => ({
        ...prev,
        accessories: [...prev.accessories, { product }],
      }))
    } else {
      const slotKey = category === 'inner-tops' ? 'innerTops' :
                      category === 'outer-tops' ? 'outerTops' :
                      category
      setOutfit(prev => ({
        ...prev,
        [slotKey]: { product },
      }))
    }
  }

  const handleRemoveItem = (category: CustomizerCategory, index?: number) => {
    if (category === 'accessories' && typeof index === 'number') {
      setOutfit(prev => ({
        ...prev,
        accessories: prev.accessories.filter((_, i) => i !== index),
      }))
    } else if (category !== 'accessories') {
      const slotKey = category === 'inner-tops' ? 'innerTops' :
                      category === 'outer-tops' ? 'outerTops' :
                      category
      setOutfit(prev => ({
        ...prev,
        [slotKey]: { product: null },
      }))
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1>Build An Outfit</h1>
        <p>Select items and see how they look on you with AI</p>
      </div>

      <div className={styles.customizerLayout}>
        <div className={styles.selectorPanel}>
          <CategoryProductSelector
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onProductSelect={handleProductSelect}
          />
        </div>

        <div className={styles.thumbnailsPanel}>
          <SelectedItemsThumbnails
            outfit={outfit}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        <div className={styles.previewPanel}>
          <MultiItemTryOnPreview outfit={outfit} />
        </div>
      </div>
    </main>
  )
}
