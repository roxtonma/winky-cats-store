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
      </main>
    </div>
  );
}
