'use client'

import { useState } from 'react'
import styles from './styles/TestimonialsSection.module.css'

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'Absolutely love the quality! The fabric is so soft and the print hasn\'t faded even after multiple washes. Worth every rupee!',
    product: 'Minimalist Tee',
    image: null, // Placeholder for customer photo
  },
  {
    id: 2,
    name: 'Rahul Verma',
    location: 'Delhi',
    rating: 5,
    text: 'Best t-shirts I\'ve bought online. The fit is perfect and the designs are exactly what I was looking for. Highly recommend!',
    product: 'Pastel Collection',
    image: null,
  },
  {
    id: 3,
    name: 'Ananya Patel',
    location: 'Bangalore',
    rating: 5,
    text: 'Super impressed with the delivery and packaging. The notebook quality is premium and the design is so aesthetic!',
    product: 'Journal Notebook',
    image: null,
  },
  {
    id: 4,
    name: 'Arjun Singh',
    location: 'Pune',
    rating: 5,
    text: 'Finally found a brand that gets minimalist design right. Clean, simple, and high quality. Will definitely order again!',
    product: 'Basic Hoodie',
    image: null,
  },
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>What Our Customers Say</h2>
        <p className={styles.subtitle}>Join 2,000+ happy customers across India</p>
      </div>

      <div className={styles.testimonialContainer}>
        {/* Navigation Arrows */}
        <button
          onClick={prevTestimonial}
          className={`${styles.navButton} ${styles.navButtonPrev}`}
          aria-label="Previous testimonial"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          onClick={nextTestimonial}
          className={`${styles.navButton} ${styles.navButtonNext}`}
          aria-label="Next testimonial"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Testimonial Cards */}
        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => {
            const isActive = index === currentIndex
            const isNext = index === (currentIndex + 1) % testimonials.length
            const isPrev = index === (currentIndex - 1 + testimonials.length) % testimonials.length

            return (
              <div
                key={testimonial.id}
                className={`${styles.testimonialCard} ${
                  isActive ? styles.active : ''
                } ${isNext ? styles.next : ''} ${isPrev ? styles.prev : ''}`}
              >
                <div className={styles.stars}>
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#FFD700">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  ))}
                </div>

                <p className={styles.testimonialText}>{testimonial.text}</p>

                <div className={styles.customerInfo}>
                  <div className={styles.customerAvatar}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className={styles.customerDetails}>
                    <span className={styles.customerName}>{testimonial.name}</span>
                    <span className={styles.customerLocation}>{testimonial.location}</span>
                  </div>
                </div>

                <span className={styles.productTag}>{testimonial.product}</span>
              </div>
            )
          })}
        </div>

        {/* Dots Indicator */}
        <div className={styles.dotsContainer}>
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
