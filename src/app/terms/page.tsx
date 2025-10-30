import { Metadata } from 'next';
import styles from './terms.module.css';

export const metadata: Metadata = {
  title: 'Terms and Conditions - Winky Cats Store',
  description: 'Terms and conditions for using Winky Cats Store and purchasing our products.',
};

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Terms and Conditions</h1>

        <div className={styles.intro}>
          <p>
            Welcome to Winky Cats Store. By accessing our website and making a purchase,
            you agree to be bound by these terms and conditions.
          </p>
          <p className={styles.effectiveDate}>
            Effective Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
            <p>
              By using this website and placing an order, you acknowledge that you have read,
              understood, and agree to be bound by these Terms and Conditions. If you do not
              agree with any part of these terms, please do not use our website or services.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Use of Website</h2>
            <div className={styles.subsection}>
              <h3>Eligibility</h3>
              <p>
                You must be at least 18 years old to make a purchase on our website. By placing
                an order, you confirm that you are of legal age to enter into a binding contract.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Account Security</h3>
              <p>
                If you create an account with us, you are responsible for maintaining the
                confidentiality of your account credentials and for all activities that occur
                under your account.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Prohibited Activities</h3>
              <p>You agree not to:</p>
              <ul>
                <li>Use the website for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the website</li>
                <li>Copy, reproduce, or distribute content without permission</li>
                <li>Use automated systems to access the website</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Products and Pricing</h2>
            <div className={styles.subsection}>
              <h3>Product Information</h3>
              <p>
                We strive to provide accurate product descriptions and images. However, we do not
                warrant that product descriptions, colors, or other content are accurate, complete,
                or error-free. Colors may vary slightly due to screen display differences.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Pricing</h3>
              <p>
                All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes
                unless otherwise stated. We reserve the right to change prices at any time without
                prior notice. Price changes will not affect orders that have already been placed.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Product Availability</h3>
              <p>
                We make every effort to ensure products are in stock. However, items may become
                unavailable after an order is placed. In such cases, we will notify you promptly
                and offer a refund or alternative product.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Orders and Payment</h2>
            <div className={styles.subsection}>
              <h3>Order Acceptance</h3>
              <p>
                Your order constitutes an offer to purchase. We reserve the right to accept or
                decline any order at our discretion. Order confirmation does not guarantee acceptance.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Payment Methods</h3>
              <p>
                We accept payments through Razorpay, which supports various payment methods including
                credit/debit cards, UPI, net banking, and digital wallets. All payment information
                is processed securely.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Payment Security</h3>
              <p>
                We do not store your payment card details. All transactions are processed through
                secure payment gateways compliant with industry standards.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Shipping and Delivery</h2>
            <p>
              Shipping policies, delivery times, and charges are detailed in our{' '}
              <a href="/shipping-returns" className={styles.link}>Shipping & Returns Policy</a>.
              We are not responsible for delays caused by courier services or unforeseen circumstances
              beyond our control.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Returns and Refunds</h2>
            <p>
              Our return and refund policies are outlined in our{' '}
              <a href="/shipping-returns" className={styles.link}>Shipping & Returns Policy</a>.
              Please review these policies before making a purchase.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Intellectual Property</h2>
            <p>
              All content on this website, including but not limited to text, images, logos,
              graphics, and designs, is the property of Winky Cats Store or its licensors and
              is protected by copyright and trademark laws. You may not use, reproduce, or
              distribute any content without our express written permission.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Custom Designs</h2>
            <p>
              For custom-designed products, you grant us a non-exclusive license to use any
              designs or content you provide for the purpose of creating your order. You
              represent and warrant that you have the right to use such content and that it
              does not infringe on any third-party rights.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Winky Cats Store shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising from
              your use of our website or products. Our total liability shall not exceed the
              amount you paid for the specific product giving rise to the claim.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Winky Cats Store, its officers, directors,
              employees, and agents from any claims, damages, losses, liabilities, and expenses
              (including legal fees) arising from your use of our website, violation of these
              terms, or infringement of any third-party rights.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. Privacy</h2>
            <p>
              Your use of our website is also governed by our{' '}
              <a href="/privacy" className={styles.link}>Privacy Policy</a>, which describes
              how we collect, use, and protect your personal information.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>12. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms and Conditions at any time. Changes
              will be effective immediately upon posting on this page. Your continued use of
              the website after changes are posted constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>13. Governing Law</h2>
            <p>
              These Terms and Conditions are governed by and construed in accordance with the
              laws of India. Any disputes arising from these terms or your use of our website
              shall be subject to the exclusive jurisdiction of the courts in Mumbai, India.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>14. Severability</h2>
            <p>
              If any provision of these Terms and Conditions is found to be invalid or unenforceable,
              the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>15. Contact Information</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <p>
              Email: <a href="mailto:hello@winkycats.in" className={styles.link}>hello@winkycats.in</a>
            </p>
            <p>
              Visit our <a href="/contact" className={styles.link}>Contact Us</a> page for more
              contact options.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
