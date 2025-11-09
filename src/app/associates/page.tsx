'use client'

import { useMemo, useState } from 'react'
import { AmazonProductCard } from '@/components/AmazonProductCard'
import { AmazonDisclosure } from '@/components/AmazonDisclosure'
import { AmazonProduct, AmazonProductCategory } from '@/types/amazon'
import { enhanceProductsWithAffiliateLinks } from '@/lib/amazonUtils'
import { ScrollReveal } from '@/components/ScrollReveal'
import amazonData from '@/data/amazonProducts.json'
import styles from './associates.module.css'

export default function AssociatesPage() {
  // Dynamically inject associate ID into affiliate links
  const products = useMemo(() =>
    enhanceProductsWithAffiliateLinks(
      amazonData.products as AmazonProduct[],
      amazonData.associateId,
      amazonData.defaultMarketplace
    ),
    []
  )

  const [selectedCategory, setSelectedCategory] = useState<AmazonProductCategory | 'all'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount' | 'name'>('featured')

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(product => cats.add(product.category))
    return Array.from(cats).sort()
  }, [products])

  // Get all tags with their usage count, sorted by frequency
  const tagFrequency = useMemo(() => {
    const tagCounts = new Map<string, number>()
    products.forEach(product => {
      product.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([tag]) => tag)
  }, [products])

  // Top 10 most frequently used tags
  const topTags = useMemo(() => tagFrequency.slice(0, 10), [tagFrequency])

  // All available tags for search
  const allTags = useMemo(() => tagFrequency, [tagFrequency])

  // Fuzzy match function for tag search
  const fuzzyMatch = (str: string, pattern: string): number => {
    if (pattern === '') return 0

    const strLower = str.toLowerCase()
    const patternLower = pattern.toLowerCase()

    // Exact match gets highest score
    if (strLower === patternLower) return 1000

    // Starts with pattern gets high score
    if (strLower.startsWith(patternLower)) return 500

    // Contains pattern gets medium score
    if (strLower.includes(patternLower)) return 250

    // Fuzzy character-by-character matching
    let patternIdx = 0
    let score = 0

    for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
      if (strLower[i] === patternLower[patternIdx]) {
        score += 1
        patternIdx++
      }
    }

    return patternIdx === patternLower.length ? score : 0
  }

  // Filtered tags based on search query
  const searchedTags = useMemo(() => {
    if (tagSearchQuery.trim() === '') return []

    return allTags
      .map(tag => ({ tag, score: fuzzyMatch(tag, tagSearchQuery) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Show top 10 matches
      .map(({ tag }) => tag)
  }, [allTags, tagSearchQuery])

  // Filter products by search, category, and tags
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Product search filter
    if (productSearchQuery.trim()) {
      const query = productSearchQuery.trim()
      filtered = filtered
        .map(product => {
          const nameScore = fuzzyMatch(product.name, query)
          const descScore = fuzzyMatch(product.description, query) * 0.5 // Description has lower weight
          const totalScore = nameScore + descScore
          return { product, score: totalScore }
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ product }) => product)
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(product => {
        const productTags = product.tags || []
        return selectedTags.some(tag => productTags.includes(tag))
      })
    }

    return filtered
  }, [products, productSearchQuery, selectedCategory, selectedTags])

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts]

    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
      case 'price-desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
      case 'discount':
        return sorted.sort((a, b) => {
          const discountA = a.originalPrice && a.price
            ? ((a.originalPrice - a.price) / a.originalPrice) * 100
            : 0
          const discountB = b.originalPrice && b.price
            ? ((b.originalPrice - b.price) / b.originalPrice) * 100
            : 0
          return discountB - discountA
        })
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'featured':
      default:
        // Featured products first, then regular products
        return sorted.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return 0 // Maintain original order within each group
        })
    }
  }, [filteredProducts, sortBy])

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // Clear all tag filters
  const clearTags = () => {
    setSelectedTags([])
  }

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className={styles.container}>
      <ScrollReveal delay={0.1}>
        <header className={styles.header}>
          <h1 className={styles.title}>Recommended Products</h1>
          <p className={styles.subtitle}>
            Curated selection of quality products from Amazon that we recommend
          </p>
        </header>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <AmazonDisclosure />
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <div className={styles.filterBar}>
        {/* Search Row - Product and Tag Search Side by Side */}
        <div className={styles.filterGroup}>
          <div className={styles.searchRow}>
            <div className={styles.searchWrapper}>
              <label className={styles.filterLabel}>Search Products:</label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className={styles.productSearchInput}
                />
                {productSearchQuery && (
                  <button
                    className={styles.clearSearchButton}
                    onClick={() => setProductSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {allTags.length > 0 && (
              <div className={styles.tagSearchWrapper}>
                <label className={styles.filterLabel}>Search Tags:</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="Search tags..."
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    className={styles.tagSearchInput}
                  />
                  {tagSearchQuery && (
                    <button
                      className={styles.clearSearchButton}
                      onClick={() => setTagSearchQuery('')}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Category:</label>
          <div className={styles.categoryButtons}>
            <button
              className={`${styles.categoryButton} ${selectedCategory === 'all' ? styles.active : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Products
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
                onClick={() => setSelectedCategory(category as AmazonProductCategory)}
              >
                {formatCategoryName(category)}
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className={styles.filterGroup}>
            <div className={styles.tagFilterHeader}>
              <label className={styles.filterLabel}>Filter by Tags:</label>
              {selectedTags.length > 0 && (
                <button
                  className={styles.clearTagsButton}
                  onClick={clearTags}
                >
                  Clear ({selectedTags.length})
                </button>
              )}
            </div>

            {/* Display search results or top tags */}
            <div className={styles.tagFilters}>
              {(tagSearchQuery ? searchedTags : topTags).map(tag => (
                <button
                  key={tag}
                  className={`${styles.tagButton} ${selectedTags.includes(tag) ? styles.active : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            {tagSearchQuery && searchedTags.length === 0 && (
              <p className={styles.noTagsFound}>No tags found matching &quot;{tagSearchQuery}&quot;</p>
            )}

            {!tagSearchQuery && topTags.length < allTags.length && (
              <p className={styles.tagHint}>
                Showing top {topTags.length} tags. Use search to find more.
              </p>
            )}
          </div>
        )}
      </div>

      <div className={styles.resultsInfo}>
        <p className={styles.resultCount}>
          Showing {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'}
        </p>

        <div className={styles.sortWrapper}>
          <label className={styles.sortLabel}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className={styles.sortSelect}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="discount">Highest Discount</option>
            <option value="name">Name: A-Z</option>
          </select>
        </div>
      </div>
      </ScrollReveal>

      <ScrollReveal delay={0.25}>
        {sortedProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No products found in this category.</p>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {sortedProducts.map(product => (
              <AmazonProductCard
                key={product.id}
                product={product}
                defaultCurrency={amazonData.defaultCurrency}
              />
            ))}
          </div>
        )}
      </ScrollReveal>
    </div>
  )
}
