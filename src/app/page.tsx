import Link from 'next/link'
import styles from './home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <main>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Welcome to Winky-Cats Store!</h1>
          <p className={styles.heroSubtitle}>
            Your one-stop shop for custom apparel and accessories
          </p>
        </div>

        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>Featured Categories</h2>
          <div className={styles.categoriesGrid}>
            <Link href="/products?category=t-shirts" className={styles.categoryCard}>
              <h3 className={styles.categoryTitle}>T-Shirts & Apparel</h3>
              <p className={styles.categoryDescription}>
                Custom printed t-shirts, hoodies, and apparel for every style
              </p>
            </Link>
            <Link href="/products?category=accessories" className={styles.categoryCard}>
              <h3 className={styles.categoryTitle}>Accessories</h3>
              <p className={styles.categoryDescription}>
                Bags, mugs, and other custom accessories with your designs
              </p>
            </Link>
            <Link href="/products" className={styles.categoryCard}>
              <h3 className={styles.categoryTitle}>Custom Designs</h3>
              <p className={styles.categoryDescription}>
                Want something to your liking? Let us know your taste!
              </p>
            </Link>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <Link href="/products" className={styles.shopAllBtn}>
            Shop All Products
          </Link>
        </section>

        <section className={styles.policySection}>
          <h2 className={styles.policySectionTitle}>Important Links</h2>
          <div className={styles.policyGrid}>
            <Link href="/contact" className={styles.policyCard}>
              <div className={styles.policyIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3 className={styles.policyCardTitle}>Contact Us</h3>
              <p className={styles.policyCardDescription}>
                Get in touch with our support team
              </p>
            </Link>
            <Link href="/shipping-returns" className={styles.policyCard}>
              <div className={styles.policyIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <h3 className={styles.policyCardTitle}>Shipping & Returns</h3>
              <p className={styles.policyCardDescription}>
                Learn about delivery and return policies
              </p>
            </Link>
            <Link href="/terms" className={styles.policyCard}>
              <div className={styles.policyIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className={styles.policyCardTitle}>Terms & Conditions</h3>
              <p className={styles.policyCardDescription}>
                Read our terms of service
              </p>
            </Link>
            <Link href="/privacy" className={styles.policyCard}>
              <div className={styles.policyIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className={styles.policyCardTitle}>Privacy Policy</h3>
              <p className={styles.policyCardDescription}>
                How we protect your information
              </p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
