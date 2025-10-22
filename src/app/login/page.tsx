'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)

  useEffect(() => {
    // Check if redirected after successful password reset
    if (searchParams.get('reset') === 'success') {
      setPasswordResetSuccess(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowSignUpPrompt(false)
    setLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        console.error('Sign in error:', error)

        // Provide better error messages
        let errorMessage = error.message || 'Failed to sign in'
        let isCredentialError = false

        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid credentials. This email may not be registered yet.'
          isCredentialError = true
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address'
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later'
        }

        setError(errorMessage)
        setShowSignUpPrompt(isCredentialError)
        setLoading(false)
        return
      }

      console.log('Sign in successful, auth state updated, redirecting...')

      // Check for redirect path first
      const redirectPath = sessionStorage.getItem('redirectAfterLogin')
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin')
        router.push(redirectPath)
        setLoading(false)
        return
      }

      // Redirect to account page - it will handle profile setup check
      router.push('/account')
      setLoading(false)
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please check the console for details.')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setShowSignUpPrompt(false)
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

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setError('')
    setResetEmailSent(false)
    setResetLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error('Password reset error:', error)
        setError('Failed to send reset email. Please try again.')
        setResetLoading(false)
        return
      }

      setResetEmailSent(true)
      setResetLoading(false)
    } catch (err) {
      console.error('Password reset error:', err)
      setError('An unexpected error occurred. Please try again.')
      setResetLoading(false)
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

        <div className={styles.divider}>or sign in with email</div>

        {/* Email/Password Form - Secondary Option */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {passwordResetSuccess && (
            <div className={styles.successMessage}>
              Password updated successfully! You can now sign in with your new password.
            </div>
          )}

          {error && (
            <div>
              <div className={styles.errorText}>{error}</div>
              {showSignUpPrompt && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <Link href="/signup" className={styles.signUpPrompt}>
                    Create an account instead →
                  </Link>
                </div>
              )}
            </div>
          )}

          {resetEmailSent && (
            <div className={styles.successMessage}>
              Check your email for a password reset link. Please also check your spam folder if you don&apos;t see it.
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
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={handleForgotPassword}
              className={styles.forgotPasswordLink}
              disabled={resetLoading}
            >
              {resetLoading ? 'Sending...' : 'Forgot Password?'}
            </button>
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
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
