'use client'

import { useState, useEffect } from 'react'
import { CustomizerCategory, CustomizerProduct } from '@/types/customizer'
import Image from 'next/image'
import {
  HeadIcon,
  InnerTopIcon,
  OuterTopIcon,
  BottomsIcon,
  ShoesIcon,
  AccessoriesIcon,
} from './icons/CategoryIcons'
import styles from './styles/CategoryProductSelector.module.css'

interface CategoryProductSelectorProps {
  activeCategory: CustomizerCategory
  onCategoryChange: (category: CustomizerCategory) => void
  onProductSelect: (category: CustomizerCategory, product: CustomizerProduct) => void
}

const categories: { slug: CustomizerCategory; label: string; Icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { slug: 'head', label: 'Head', Icon: HeadIcon },
  { slug: 'inner-tops', label: 'Inner Tops', Icon: InnerTopIcon },
  { slug: 'outer-tops', label: 'Outer Tops', Icon: OuterTopIcon },
  { slug: 'bottoms', label: 'Bottoms', Icon: BottomsIcon },
  { slug: 'shoes', label: 'Shoes', Icon: ShoesIcon },
  { slug: 'accessories', label: 'Accessories', Icon: AccessoriesIcon },
]

export default function CategoryProductSelector({
  activeCategory,
  onCategoryChange,
  onProductSelect,
}: CategoryProductSelectorProps) {
  const [products, setProducts] = useState<CustomizerProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      try {
        // Use placeholder data for now (will fetch real products once DB is populated)
        const placeholderProducts = await getPlaceholderProducts(activeCategory)
        setProducts(placeholderProducts)

        // Uncomment when database has layerable products:
        // const { fetchCustomizerProducts } = await import('@/lib/customizerProducts')
        // const products = await fetchCustomizerProducts(activeCategory)
        // setProducts(products)
      } catch (error) {
        console.error('Error loading products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [activeCategory])

  return (
    <div className={styles.container}>
      <div className={styles.categoryTabs}>
        {categories.map(cat => {
          const { Icon } = cat
          return (
            <button
              key={cat.slug}
              className={`${styles.categoryTab} ${activeCategory === cat.slug ? styles.active : ''}`}
              onClick={() => onCategoryChange(cat.slug)}
            >
              <Icon className={styles.categoryIcon} size={20} />
              <span className={styles.categoryLabel}>{cat.label}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.productGrid}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No products available</p>
            <span>Check back later for items in this category</span>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className={styles.productCard}>
              <div className={styles.productImage}>
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 300px"
                  style={{ objectFit: 'cover' }}
                />
                {product.source === 'affiliate' && (
                  <span className={styles.affiliateBadge}>Amazon</span>
                )}
              </div>
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.name}</h3>
                {product.price && (
                  <p className={styles.productPrice}>₹{product.price}</p>
                )}
                <button
                  className={styles.selectButton}
                  onClick={() => {
                    if (product.source === 'affiliate' && product.affiliateLink) {
                      window.open(product.affiliateLink, '_blank', 'noopener,noreferrer')
                    } else {
                      onProductSelect(activeCategory, product)
                    }
                  }}
                >
                  {product.source === 'affiliate' ? 'View on Amazon' : 'Add to Outfit'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Placeholder product generator (will be replaced with actual API)
async function getPlaceholderProducts(category: CustomizerCategory): Promise<CustomizerProduct[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const placeholderImages: Record<CustomizerCategory, string> = {
    'head': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400',
    'inner-tops': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    'outer-tops': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    'bottoms': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400',
    'shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    'accessories': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
  }

  return [
    {
      id: `${category}-placeholder-1`,
      name: `${category} Item 1`,
      category,
      images: [placeholderImages[category]],
      price: 499,
      source: 'store',
      layerOrder: 10,
    },
    {
      id: `${category}-placeholder-2`,
      name: `${category} Item 2`,
      category,
      images: [placeholderImages[category]],
      price: 699,
      source: 'store',
      layerOrder: 10,
    },
    {
      id: `${category}-placeholder-3`,
      name: `${category} Item 3 (Amazon)`,
      category,
      images: [placeholderImages[category]],
      price: 599,
      source: 'affiliate',
      layerOrder: 10,
      affiliateLink: 'https://amazon.in',
    },
  ]
}
