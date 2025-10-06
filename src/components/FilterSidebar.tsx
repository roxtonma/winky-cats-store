'use client'

import { useState, useEffect } from 'react'
import styles from './styles/FilterSidebar.module.css'

export type FilterState = {
  priceRange: [number, number]
  inStock: boolean
  selectedTags: string[]
}

type FilterSidebarProps = {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  availableTags: string[]
  maxPrice: number
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function FilterSidebar({ filters, onFilterChange, availableTags, maxPrice, isMobileOpen, onMobileClose }: FilterSidebarProps) {
  const [localPriceRange, setLocalPriceRange] = useState(filters.priceRange)

  // Update local price when filters change externally
  useEffect(() => {
    setLocalPriceRange(filters.priceRange)
  }, [filters.priceRange])

  const handlePriceChange = (index: number, value: number) => {
    const newRange: [number, number] = [...localPriceRange] as [number, number]
    newRange[index] = value
    setLocalPriceRange(newRange)
  }

  const handlePriceCommit = () => {
    onFilterChange({ ...filters, priceRange: localPriceRange })
  }

  const handleStockToggle = () => {
    onFilterChange({ ...filters, inStock: !filters.inStock })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag]
    onFilterChange({ ...filters, selectedTags: newTags })
  }

  const handleClearFilters = () => {
    onFilterChange({
      priceRange: [0, maxPrice],
      inStock: false,
      selectedTags: []
    })
  }

  const hasActiveFilters =
    filters.inStock ||
    filters.selectedTags.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < maxPrice

  // Close mobile drawer on escape key
  useEffect(() => {
    if (!isMobileOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onMobileClose) {
        onMobileClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileOpen, onMobileClose])

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className={styles.backdrop}
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Filters</h2>
          <div className={styles.headerActions}>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearBtn}>
                Clear All
              </button>
            )}
            {onMobileClose && (
              <button onClick={onMobileClose} className={styles.closeBtn} aria-label="Close filters">
                ✕
              </button>
            )}
          </div>
        </div>

      {/* Price Range */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Price Range</h3>
        <div className={styles.priceInputs}>
          <div className={styles.priceInput}>
            <label>Min</label>
            <input
              type="number"
              min={0}
              max={maxPrice}
              value={localPriceRange[0]}
              onChange={(e) => handlePriceChange(0, Number(e.target.value))}
              onBlur={handlePriceCommit}
              className={styles.input}
            />
          </div>
          <span className={styles.priceSeparator}>-</span>
          <div className={styles.priceInput}>
            <label>Max</label>
            <input
              type="number"
              min={0}
              max={maxPrice}
              value={localPriceRange[1]}
              onChange={(e) => handlePriceChange(1, Number(e.target.value))}
              onBlur={handlePriceCommit}
              className={styles.input}
            />
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={maxPrice}
          value={localPriceRange[1]}
          onChange={(e) => handlePriceChange(1, Number(e.target.value))}
          onMouseUp={handlePriceCommit}
          onTouchEnd={handlePriceCommit}
          className={styles.rangeSlider}
        />
      </div>

      {/* Stock Filter */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Availability</h3>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={handleStockToggle}
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div className={styles.filterSection}>
          <h3 className={styles.filterTitle}>Tags</h3>
          <div className={styles.tagsList}>
            {availableTags.map((tag) => (
              <label key={tag} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={filters.selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  )
}
