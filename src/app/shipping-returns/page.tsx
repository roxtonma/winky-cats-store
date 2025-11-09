import { Metadata } from 'next';
import styles from './shipping-returns.module.css';

export const metadata: Metadata = {
  title: 'Shipping & Returns - Winky Cats Store',
  description: 'Learn about our shipping policy, delivery times, and return/refund process.',
};

export default function ShippingReturnsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Shipping & Returns Policy</h1>

        <div className={styles.intro}>
          <p>
            We want you to love your Winky Cats products! Here&apos;s everything you need to know
            about shipping, delivery, returns, and refunds.
          </p>
        </div>

        <div className={styles.sections}>
          {/* Shipping Policy */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Shipping Policy</h2>

            <div className={styles.subsection}>
              <h3>Shipping Coverage</h3>
              <p>We currently ship to all locations within India.</p>
            </div>

            <div className={styles.subsection}>
              <h3>Processing Time</h3>
              <p>
                Orders are typically processed within 1-3 business days. During peak seasons
                or special promotions, processing may take up to 5 business days.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Delivery Time</h3>
              <ul>
                <li><strong>Metro Cities:</strong> 3-5 business days</li>
                <li><strong>Other Cities:</strong> 5-7 business days</li>
                <li><strong>Remote Areas:</strong> 7-10 business days</li>
              </ul>
              <p className={styles.note}>
                Note: Delivery times are estimates and may vary based on location and courier availability.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Shipping Charges</h3>
              <p>Shipping charges are calculated at checkout based on your location and order value.</p>
              <p><strong>Free Shipping:</strong> Available on orders above ₹999</p>
            </div>

            <div className={styles.subsection}>
              <h3>Order Tracking</h3>
              <p>
                Once your order is shipped, you&apos;ll receive a tracking number via email.
                You can also track your order status in your{' '}
                <a href="/account/orders" className={styles.link}>account dashboard</a>.
              </p>
            </div>
          </section>

          {/* Returns Policy */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Returns & Exchanges</h2>

            <div className={styles.subsection}>
              <h3>Return Window</h3>
              <p>
                We accept returns within <strong>7 days</strong> of delivery. Products must be unused,
                unwashed, and in their original condition with all tags attached.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Eligible Items</h3>
              <p>The following items are eligible for return or exchange:</p>
              <ul>
                <li>Defective or damaged products</li>
                <li>Incorrect items delivered</li>
                <li>Size or fit issues</li>
                <li>Products not matching the description</li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <h3>Non-Returnable Items</h3>
              <p>The following items cannot be returned:</p>
              <ul>
                <li>Custom-designed or personalized products</li>
                <li>Products with removed or damaged tags</li>
                <li>Washed or worn items</li>
                <li>Sale or clearance items (unless defective)</li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <h3>How to Initiate a Return</h3>
              <ol className={styles.orderedList}>
                <li>Contact us at <a href="mailto:hello@winkycats.in" className={styles.link}>hello@winkycats.in</a> within 7 days of delivery</li>
                <li>Include your order number and reason for return along with any images of the products for reference</li>
                <li>We will review and provide return instructions</li>
                <li>Pack the item securely with original tags and invoice</li>
                <li>Ship the item to the provided return address</li>
              </ol>
            </div>

            <div className={styles.subsection}>
              <h3>Return Shipping</h3>
              <p>
                <strong>Defective/Wrong Items:</strong> We cover return shipping costs.
              </p>
              <p>
                <strong>Other Returns:</strong> Customer is responsible for return shipping costs.
              </p>
            </div>
          </section>

          {/* Refunds Policy */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Refunds & Cancellations</h2>

            <div className={styles.subsection}>
              <h3>Refund Processing</h3>
              <p>
                Once we receive and inspect your returned item, we&apos;ll process your refund within
                5-7 business days. The refund will be credited to your original payment method.
              </p>
              <p className={styles.note}>
                Note: It may take an additional 5-10 business days for the refund to reflect in your account,
                depending on your bank or payment provider.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Order Cancellation</h3>
              <p>
                <strong>Before Shipping:</strong> Orders can be cancelled free of charge before they are
                shipped. Contact us immediately at{' '}
                <a href="mailto:hello@winkycats.in" className={styles.link}>hello@winkycats.in</a>.
              </p>
              <p>
                <strong>After Shipping:</strong> Once an order is shipped, it cannot be cancelled. You may
                return the item following our returns policy.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Refund for Defective Items</h3>
              <p>
                If you receive a defective or damaged product, we&apos;ll provide a full refund including
                shipping charges. We may also offer a replacement at no additional cost.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Partial Refunds</h3>
              <p>Partial refunds may be issued in the following cases:</p>
              <ul>
                <li>Items with obvious signs of use</li>
                <li>Items returned after the 7-day window (at our discretion)</li>
                <li>Items without original packaging or tags</li>
              </ul>
            </div>
          </section>

          {/* Contact Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Questions?</h2>
            <p>
              If you have any questions about our shipping or returns policy, please don&apos;t hesitate
              to reach out:
            </p>
            <p>
              Email: <a href="mailto:hello@winkycats.in" className={styles.link}>hello@winkycats.in</a>
            </p>
            <p>
              Or visit our <a href="/contact" className={styles.link}>Contact Us</a> page.
            </p>
          </section>

          <div className={styles.lastUpdated}>
            <p>Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
