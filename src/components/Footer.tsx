import Link from 'next/link';
import Image from 'next/image';
import styles from './styles/Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* About Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Winky Cats</h3>
            <p className={styles.description}>
              We aim to bring you a better online shopping experience. Grow with us.
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
                <Link href="/customize" className={styles.link}>Custom Design</Link>
              </li>
              <li>
                <Link href="/associates" className={styles.link}>Affiliate Products</Link>
              </li>
              <li>
                <Link href="/account" className={styles.link}>My Account</Link>
              </li>
              <li>
                <Link href="/account/orders" className={styles.link}>My Orders</Link>
              </li>
            </ul>
          </div>

          {/* About Us */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>About Us</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/about" className={styles.link}>About Us</Link>
              </li>
              <li>
                <Link href="/contact" className={styles.link}>Contact Us</Link>
              </li>
              <li>
                <Link href="/shipping-returns" className={styles.link}>Shipping & Returns</Link>
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

        {/* Trusted Partners */}
        <div className={styles.paymentSection}>
          <h4 className={styles.paymentTitle}>Trusted Partners</h4>
          <div className={styles.partnerLogos}>
            <a href="https://razorpay.com/" target="_blank" rel="noopener noreferrer" className={styles.partnerBadge}>
              <Image
                src="https://badges.razorpay.com/badge-light.png"
                alt="Razorpay"
                width={113}
                height={45}
                referrerPolicy="origin"
              />
            </a>
            <a href="https://www.delhivery.com/" target="_blank" rel="noopener noreferrer" className={styles.partnerBadge}>
              <Image
                src="https://logo.clearbit.com/delhivery.com"
                alt="Delhivery"
                width={113}
                height={45}
                style={{ width: 'auto', height: '45px', objectFit: 'contain' }}
              />
            </a>
            <a href="https://www.bluedart.com/" target="_blank" rel="noopener noreferrer" className={styles.partnerBadge}>
              <Image
                src="https://logo.clearbit.com/bluedart.com"
                alt="Blue Dart"
                width={113}
                height={45}
                style={{ width: 'auto', height: '45px', objectFit: 'contain' }}
              />
            </a>
            <a href="https://ekartlogistics.com/" target="_blank" rel="noopener noreferrer" className={styles.partnerBadge}>
              <Image
                src="https://logo.clearbit.com/ekartlogistics.com"
                alt="Ekart"
                width={113}
                height={45}
                style={{ width: 'auto', height: '45px', objectFit: 'contain' }}
              />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {currentYear} Winky Cats Store. All rights reserved.
          </p>
          <div className={styles.socialLinks}>
            <a href="https://www.instagram.com/winky.cats" className={styles.socialLink} aria-label="Instagram">
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
