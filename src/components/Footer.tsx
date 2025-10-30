import Link from 'next/link';
import styles from './styles/Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* About Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Winky Cats Store</h3>
            <p className={styles.description}>
              Your one-stop shop for custom apparel and unique designs. Quality products with a personal touch.
            </p>
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Quick Links</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/" className={styles.link}>Home</Link>
              </li>
              <li>
                <Link href="/products" className={styles.link}>Our Products</Link>
              </li>
              <li>
                <Link href="/associates" className={styles.link}>Affiliate Products</Link>
              </li>
              <li>
                <Link href="/account" className={styles.link}>My Account</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Customer Service</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/contact" className={styles.link}>Contact Us</Link>
              </li>
              <li>
                <Link href="/shipping-returns" className={styles.link}>Shipping & Returns</Link>
              </li>
              <li>
                <Link href="/account/orders" className={styles.link}>Track Order</Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Legal</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className={styles.link}>Terms & Conditions</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {currentYear} Winky Cats Store. All rights reserved.
          </p>
          <div className={styles.socialLinks}>
            <a href="#" className={styles.socialLink} aria-label="Instagram">
              <span>Instagram</span>
            </a>
            <a href="#" className={styles.socialLink} aria-label="Facebook">
              <span>Facebook</span>
            </a>
            <a href="#" className={styles.socialLink} aria-label="Twitter">
              <span>Twitter</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
