import { Metadata } from 'next';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact Us - Winky Cats Store',
  description: 'Get in touch with Winky Cats Store. We\'re here to help with any questions about our products.',
};

export default function ContactPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Contact Us</h1>

        <div className={styles.intro}>
          <p>
            Have questions about our products or need assistance? We&apos;re here to help!
            Reach out to us through any of the following methods.
          </p>
        </div>

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Customer Support</h2>
            <div className={styles.contactMethod}>
              <h3>Email</h3>
              <p>
                <a href="mailto:hello@winkycats.in" className={styles.link}>
                  hello@winkycats.in
                </a>
              </p>
              <p className={styles.note}>We typically respond within 24-48 hours</p>
            </div>

            <div className={styles.contactMethod}>
              <h3>Business Hours</h3>
              <p>Monday - Saturday: 10:00 AM - 6:00 PM IST</p>
              <p>Sunday: Closed</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Order Support</h2>
            <p>
              For order-related queries, please have your order number ready.
              You can find this in your order confirmation email or in your{' '}
              <a href="/account/orders" className={styles.link}>account dashboard</a>.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Follow Us</h2>
            <p>Stay connected with us on social media for updates and new product launches:</p>
            <div className={styles.socialLinks}>
              <p>Instagram: <a href="https://www.instagram.com/winky.cats/" target="_blank">@winkycats</a></p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p>
              Before reaching out, you might find answers in our other help pages:
            </p>
            <ul className={styles.linkList}>
              <li><a href="/shipping-returns" className={styles.link}>Shipping & Returns Policy</a></li>
              <li><a href="/terms" className={styles.link}>Terms and Conditions</a></li>
              <li><a href="/privacy" className={styles.link}>Privacy Policy</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
