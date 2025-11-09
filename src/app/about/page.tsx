import { Metadata } from 'next';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About Us - Winky Cats Store',
  description: 'Learn about Winky Cats Store - our story, mission, and passion for creating unique cat-themed apparel',
};

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>About Winky Cats</h1>

        <div className={styles.intro}>
          <p>
            Welcome to Winky Cats, we aren&apos;t sure what we are yet but we know what we want to be.<br></br>
            A project based around a community.
          </p>
        </div>

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Our Story</h2>
            <p>
              We wanted to work on this project with one goal in mind, just starting something.
              With most of our time occupied with work day in and day out, we hardly find the time to do anything we like.
              There&apos;s a lot more that we are yet to explore and with this project, we hope to fulfill some of the things.
              <br></br>
              We like to draw, we like to write, we like to game.
              And we would like to share some of our moments with you in the hopes that you share the same with us.
            </p>          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Our Mission</h2>
            <p>
              Our goal is not to be the best or anything like that. We simply wish to be the place where people can turn to,
              a place where creativity can be fostered and those with a spark.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What We Offer</h2>
            <div className={styles.subsection}>
              <h3>Custom Designs</h3>
              <p>
                You can either select from our existing catalog of products or feel free to reach out to us on <a href='mailto:@hello@winkycats.in'>hello@winkycats.in</a> for any custom work for your daily needs or for a gift.
              </p>
            </div>
            <div className={styles.subsection}>
              <h3>Quality Materials</h3>
              <p>
                We use soft, breathable fabrics that are comfortable for all-day wear. Our printing process
                ensures vibrant, fade-resistant designs that maintain their quality wash after wash.
              </p>
            </div>
            <div className={styles.subsection}>
              <h3>Virtual Try-On</h3>
              <p>
                See a cute or cool apparel you like? Feel free to see how it will look on you by either uploading your photo or using the camera.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Join Our Community</h2>
            <p>
              We want to be more than just a store. We want to be a community who celebrate the joy
              of creativity and progress. Follow us on social media to be the first to know of our latest drops,
              special offers and more.
            </p>
            <p>
              Thank you for choosing Winky Cats. We&apos;re excited to see how your journey goes!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
