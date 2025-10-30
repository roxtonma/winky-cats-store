import { Metadata } from 'next';
import styles from './privacy.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy - Winky Cats Store',
  description: 'Privacy policy explaining how Winky Cats Store collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>

        <div className={styles.intro}>
          <p>
            Winky Cats Store is operated as an unregistered partnership based in India. We are
            committed to protecting your privacy and ensuring the security of your personal
            information. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you visit our website or make a purchase.
          </p>
          <p>
            We comply with applicable Indian laws including the Information Technology Act, 2000,
            Information Technology (Reasonable Security Practices and Procedures and Sensitive
            Personal Data or Information) Rules, 2011, Consumer Protection Act, 2019, and Income
            Tax Act, 1961.
          </p>
          <p className={styles.effectiveDate}>
            {/* Update this date manually when privacy policy changes */}
            Effective Date: January 28, 2025
          </p>
        </div>

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Information We Collect</h2>

            <div className={styles.subsection}>
              <h3>Personal Information</h3>
              <p>When you make a purchase or create an account, we collect:</p>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Shipping and billing address</li>
                <li>Payment information (processed securely through Razorpay)</li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <h3>Usage Information</h3>
              <p>We automatically collect certain information when you visit our website:</p>
              <ul>
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website</li>
                <li>Click patterns and navigation paths</li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <h3>Cookies and Tracking Technologies</h3>
              <p>
                We use cookies and similar technologies to enhance your browsing experience,
                remember your preferences, and analyze website traffic. You can control cookie
                settings through your browser preferences.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className={styles.mainList}>
              <li><strong>Order Processing:</strong> To process and fulfill your orders, including shipping and delivery</li>
              <li><strong>Communication:</strong> To send order confirmations, updates, and respond to your inquiries</li>
              <li><strong>Account Management:</strong> To create and manage your account</li>
              <li><strong>Payment Processing:</strong> To process payments securely through our payment partners</li>
              <li><strong>Customer Service:</strong> To provide customer support and address your concerns</li>
              <li><strong>Marketing:</strong> To send promotional emails about new products and offers (with your consent)</li>
              <li><strong>Website Improvement:</strong> To analyze usage patterns and improve our website and services</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. How We Share Your Information</h2>
            <p>We may share your information with third parties in the following circumstances:</p>

            <div className={styles.subsection}>
              <h3>Service Providers</h3>
              <p>We share information with trusted service providers who assist us in:</p>
              <ul>
                <li>Payment processing (Razorpay)</li>
                <li>Shipping and delivery</li>
                <li>Email communication services</li>
                <li>Website hosting and analytics</li>
                <li>Customer support tools</li>
              </ul>
              <p className={styles.note}>
                These service providers are contractually obligated to protect your information
                and use it only for the services they provide to us.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Legal Requirements</h3>
              <p>We may disclose your information if required to do so by law or in response to:</p>
              <ul>
                <li>Court orders or legal processes</li>
                <li>Government or regulatory requests</li>
                <li>Protection of our rights, property, or safety</li>
                <li>Investigation of fraud or security issues</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Data Security</h2>
            <p>
              We implement security measures to protect your personal information against
              unauthorized access, alteration, disclosure, or destruction. Our current security
              measures include:
            </p>
            <ul className={styles.mainList}>
              <li>SSL/TLS encryption for all data transmission over the internet</li>
              <li>Secure payment processing through Razorpay, a PCI-DSS compliant payment gateway. We do not store credit card information on our servers.</li>
              <li>Database access controls to ensure users can only access their own data</li>
              <li>Authentication system with secure password hashing for user accounts</li>
              <li>Regular software updates and security patches</li>
            </ul>
            <p>
              As a startup, we are continuously working to improve our security practices. We do
              not currently conduct third-party security audits, but we follow industry-standard
              security practices for e-commerce applications.
            </p>
            <p className={styles.note}>
              No method of transmission over the internet or electronic storage is 100% secure.
              While we implement reasonable security measures to protect your information, we
              cannot guarantee absolute security. Users are encouraged to use strong passwords
              and keep their account credentials confidential.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal information:</p>

            <div className={styles.subsection}>
              <h3>Access and Update</h3>
              <p>
                You can access and update your account information by logging into your{' '}
                <a href="/account/profile" className={styles.link}>account dashboard</a>.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Marketing Communications</h3>
              <p>
                You can opt out of receiving promotional emails by clicking the unsubscribe link
                in any marketing email or by contacting us directly.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Data Deletion</h3>
              <p>
                You may request deletion of your personal information by contacting us at{' '}
                <a href="mailto:hello@winkycats.in" className={styles.link}>hello@winkycats.in</a>.
                Please note that we may retain certain information as required by law or for
                legitimate business purposes.
              </p>
            </div>

            <div className={styles.subsection}>
              <h3>Cookie Preferences</h3>
              <p>
                You can manage your cookie preferences through your browser settings. Note that
                disabling cookies may affect website functionality.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Data Retention</h2>
            <p>
              We retain your personal information only as long as necessary to fulfill legitimate
              business purposes, comply with legal obligations, or as required by law.
            </p>
            <ul className={styles.mainList}>
              <li>
                <strong>Transaction and Order Records:</strong> Retained for a minimum of 7 years
                as required by the Income Tax Act, 1961, and for compliance with applicable tax
                and accounting regulations
              </li>
              <li>
                <strong>Account Information:</strong> Retained until you close your account or
                request deletion
              </li>
              <li>
                <strong>Other Personal Data:</strong> Retained only while necessary to provide our
                services or fulfill the purposes described in this policy
              </li>
            </ul>
            <p className={styles.note}>
              You may request deletion of your personal information at any time by contacting us
              at <a href="mailto:hello@winkycats.in" className={styles.link}>hello@winkycats.in</a>.
              Please note that we may retain certain information where required by law or for
              legitimate business purposes. When your information is no longer needed, we will
              securely delete or anonymize it.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites, including affiliate products.
              We are not responsible for the privacy practices of these external sites. We encourage
              you to review the privacy policies of any third-party websites you visit.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Children&apos;s Privacy</h2>
            <p>
              Our website and services are not directed to individuals under the age of 18. We do
              not knowingly collect personal information from children. If you believe we have
              inadvertently collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. International Data Transfers</h2>
            <p>
              Your information is primarily stored and processed in India. If your information is
              transferred to other countries (such as through our service providers), we ensure
              that such transfers comply with applicable data protection laws and implement
              appropriate safeguards.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9A. Governing Law and Jurisdiction</h2>
            <p>
              This Privacy Policy is governed by and construed in accordance with the laws of India,
              including the Information Technology Act, 2011 and the Consumer Protection Act, 2019.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices or legal requirements. We will notify you of any significant changes by
              posting the new policy on this page and updating the effective date. We encourage
              you to review this policy periodically.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or
              our data practices, please contact us:
            </p>
            <div className={styles.contactInfo}>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:hello@winkycats.in" className={styles.link}>hello@winkycats.in</a>
              </p>
              <p>
                <strong>Contact Page:</strong>{' '}
                <a href="/contact" className={styles.link}>Visit our Contact Us page</a>
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>12. Consent</h2>
            <p>
              By using our website and services, you consent to the collection, use, and sharing
              of your information as described in this Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
