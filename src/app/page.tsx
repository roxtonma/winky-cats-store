'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/supabase'
import { HorizontalScrollCards } from '@/components/HorizontalScrollCards'
import { ScrollReveal } from '@/components/ScrollReveal'
import { TrustBar } from '@/components/TrustBar'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import amazonProductsData from '@/data/amazonProducts.json'
import { enhanceProductsWithAffiliateLinks } from '@/lib/amazonUtils'
import { useCart } from '@/contexts/CartContext'
import { toast } from 'react-toastify'
import styles from './home.module.css'

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const { addItem } = useCart()

  // Fetch featured regular products
  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const response = await fetch('/api/products?featured=true&limit=10')
        const data = await response.json()
        setFeaturedProducts(data.products || [])
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  // Get featured affiliate products with enhanced affiliate links
  const featuredAffiliateProducts = useMemo(() => {
    const enhanced = enhanceProductsWithAffiliateLinks(
      amazonProductsData.products,
      amazonProductsData.associateId,
      amazonProductsData.defaultMarketplace
    )
    return enhanced
      .filter((product) => product.featured === true)
      .slice(0, 10)
  }, [])

  // Handle add to cart for regular products with variant selection
  const handleAddToCart = (product: Product, selectedVariant?: { size?: string; colorName?: string; images?: string[] }) => {
    const variantImage = selectedVariant?.images?.[0] || product.images?.[0]

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: variantImage,
      maxQuantity: product.inventory_quantity || 999,
      variant: selectedVariant ? {
        size: selectedVariant.size,
        colorName: selectedVariant.colorName,
      } : undefined,
    })
    toast.success(`${product.name} added to cart!`)
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* Enhanced Hero Section with Background Image */}
        <ScrollReveal delay={0.1}>
          <section className={styles.hero}>
            {/* Hero Background Image - Desktop */}
            <div className={styles.heroImageWrapper}>
              <Image
                src="/images/hero/hero-placeholder.jpg"
                alt="Winky Cats Store Collection"
                fill
                priority
                className={styles.heroImageDesktop}
                sizes="(max-width: 768px) 0vw, 100vw"
              />
              {/* Hero Background Image - Mobile */}
              <Image
                src="/images/hero/hero-mobile-placeholder.jpg"
                alt="Winky Cats Store Collection"
                fill
                priority
                className={styles.heroImageMobile}
                sizes="(max-width: 768px) 100vw, 0vw"
              />
            </div>

            {/* Scrim Layer - Simple gradient for text readability */}
            <div className={styles.heroScrimLayer}></div>

            {/* Hero Content */}
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <h1 className={styles.heroTitle}>Fashion made easier</h1>
                <p className={styles.heroSubtitle}>
                  Premium quality cotton tees, curated notebooks, and aesthetic accessories. Designed in India from us to you.
                </p>
                <div className={styles.heroCTAs}>
                  <Link href="/products?category=t-shirts" className={styles.heroCTAPrimary}>
                    Shop T-Shirts
                  </Link>
                  <Link href="/customize" className={styles.heroCTASecondary}>
                    Create Custom Design
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Trust Bar - Immediately after hero */}
        <ScrollReveal delay={0.2}>
          <TrustBar />
        </ScrollReveal>

        {/* Trending Products - Horizontal Scroll */}
        {!isLoadingProducts && featuredProducts.length > 0 && (
          <ScrollReveal delay={0.1}>
            <HorizontalScrollCards
              type="regular"
              products={featuredProducts}
              title="Trending Now"
              onAddToCart={handleAddToCart}
              defaultCurrency="₹"
            />
          </ScrollReveal>
        )}

        {/* Categories Grid */}
        <ScrollReveal delay={0.1}>
          <section className={styles.categoriesSection}>
            <h2 className={styles.sectionTitle}>Shop by Category</h2>
            <div className={styles.categoriesGrid}>
            <Link href="/products?category=t-shirts" className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
                </svg>
              </div>
              <div className={styles.categoryTitleWrapper}>
                <h3 className={styles.categoryTitle}>T-Shirts & Hoodies</h3>
              </div>
              <div>
                <p className={styles.categoryDescription}>
                  Minimalist and pastel designs
                </p>
              </div>
            </Link>
            <Link href="/products?category=stationery" className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div className={styles.categoryTitleWrapper}>
                <h3 className={styles.categoryTitle}>Notebooks & Stationery</h3>
              </div>
              <div>
                <p className={styles.categoryDescription}>
                  Dear Diary, this one&apos;s for you
                </p>
              </div>
            </Link>
            <Link href="/products?category=accessories" className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <div className={styles.categoryTitleWrapper}>
                <h3 className={styles.categoryTitle}>Phone & Accessories</h3>
              </div>
              <div>
                <p className={styles.categoryDescription}>
                  Compliment your style
                </p>
              </div>
            </Link>
            <Link href="/customize" className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                  <path d="M2 2l7.586 7.586"/>
                  <circle cx="11" cy="11" r="2"/>
                </svg>
              </div>
              <div className={styles.categoryTitleWrapper}>
                <h3 className={styles.categoryTitle}>Custom Designs</h3>
              </div>
              <div>
                <p className={styles.categoryDescription}>
                  Create something unique for yourself
                </p>
              </div>
            </Link>
          </div>
          </section>
        </ScrollReveal>

        {/* Newsletter Signup */}
        <ScrollReveal delay={0.1}>
          <NewsletterSignup />
        </ScrollReveal>

        {/* Affiliate Products - Moved to bottom */}
        {featuredAffiliateProducts.length > 0 && (
          <ScrollReveal delay={0.1}>
            <HorizontalScrollCards
              type="affiliate"
              products={featuredAffiliateProducts}
              title="Looking for something else?"
              defaultCurrency="₹"
            />
          </ScrollReveal>
        )}
      </main>
    </div>
  );
}
