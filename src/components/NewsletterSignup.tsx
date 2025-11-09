'use client'

import { useState } from 'react'
import styles from './styles/NewsletterSignup.module.css'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        if (data.reactivated) {
          setMessage('Welcome back! Your subscription has been reactivated.')
        } else {
          setMessage(`Thanks for subscribing! Check your email for your discount code: ${data.discountCode}`)
        }
        setEmail('')

        // Reset after 8 seconds
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 8000)
      } else {
        setStatus('error')
        if (data.alreadySubscribed) {
          setMessage('This email is already subscribed to our newsletter.')
        } else {
          setMessage(data.error || 'Failed to subscribe. Please try again.')
        }

        // Reset error state after 5 seconds
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 5000)
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      setStatus('error')
      setMessage('Something went wrong. Please try again later.')

      // Reset error state after 5 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textContent}>
            <h2 className={styles.title}>Get 10% Off Your First Order</h2>
            <p className={styles.subtitle}>
              Join our newsletter for exclusive deals, new arrivals, and style tips!
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.inputIcon}>
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={styles.input}
                disabled={status === 'loading' || status === 'success'}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' ? (
                <>
                  <span className={styles.spinner}></span>
                  Subscribing...
                </>
              ) : status === 'success' ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Subscribed!
                </>
              ) : (
                'Subscribe & Get 10% Off'
              )}
            </button>
          </form>

          {message && (
            <p className={`${styles.message} ${status === 'error' ? styles.messageError : styles.messageSuccess}`}>
              {message}
            </p>
          )}

          <p className={styles.disclaimer}>
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
