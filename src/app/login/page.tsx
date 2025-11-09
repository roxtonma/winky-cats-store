'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import styles from './page.module.css'

function LoginForm() {
  const { signInWithMagicLink, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMagicLinkSent(false)
    setLoading(true)

    try {
      const { error } = await signInWithMagicLink(email)

      if (error) {
        console.error('Magic link error:', error)

        // Provide better error messages
        let errorMessage = error.message || 'Failed to send magic link'

        if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address'
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Too many attempts. Please try again later'
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = 'Please wait a moment before requesting another link'
        }

        setError(errorMessage)
        setLoading(false)
        return
      }

      console.log('Magic link sent successfully')
      setMagicLinkSent(true)
      setLoading(false)
    } catch (err) {
      console.error('Magic link error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setMagicLinkSent(false)
    setLoading(true)

    try {
      const { error } = await signInWithGoogle()

      if (error) {
        console.error('Google sign in error:', error)
        setError('Failed to sign in with Google. Please try again.')
        setLoading(false)
        return
      }

      // The redirect to Google happens automatically
      // When they come back, the callback route will handle the session
    } catch (err) {
      console.error('Google sign in error:', err)
      setError('An unexpected error occurred with Google sign in.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        {/* Google Sign-In Button - Primary Option */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className={styles.googleButton}
          disabled={loading}
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className={styles.divider}>or continue with email</div>

        {/* Magic Link Form - Secondary Option */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorText}>{error}</div>}

          {magicLinkSent && (
            <div className={styles.successMessage}>
              Check your email! We sent you a magic link to sign in. The link will expire in 1 hour.
              <br />
              <small style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
                Don&apos;t see it? Check your spam folder.
              </small>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={magicLinkSent}
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading || magicLinkSent}
          >
            {loading ? 'Sending...' : magicLinkSent ? 'Magic Link Sent!' : 'Send Magic Link'}
          </button>

          {magicLinkSent && (
            <button
              type="button"
              onClick={() => {
                setMagicLinkSent(false)
                setEmail('')
              }}
              className={styles.forgotPasswordLink}
              style={{ marginTop: '0.5rem', textAlign: 'center', width: '100%' }}
            >
              Try a different email
            </button>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <span style={{ color: '#718096', fontSize: '0.875rem' }}>
            Don&apos;t have an account?{' '}
          </span>
          <Link href="/signup" className={styles.link}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
