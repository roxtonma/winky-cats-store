'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { validatePhone } from '@/lib/validation'
import styles from '../../login/page.module.css'
import accountStyles from '../page.module.css'

export default function ProfileEditPage() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading, refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailChangeMessage, setEmailChangeMessage] = useState('')
  const [emailChangeError, setEmailChangeError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (userProfile) {
      setName(userProfile.name)
      setPhone(userProfile.phone_number)
    }
  }, [user, userProfile, authLoading, router])

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    setPhoneError('')
    setSuccess(false)

    if (value && phoneError) {
      const { isValid } = validatePhone(value)
      if (!isValid) {
        setPhoneError('Enter a valid 10-digit Indian phone number starting with 6-9')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPhoneError('')
    setSuccess(false)

    const phoneValidation = validatePhone(phone)
    if (!phoneValidation.isValid) {
      setPhoneError('Enter a valid 10-digit Indian phone number starting with 6-9')
      return
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          name: name.trim(),
          phone_number: phone,
        })
        .eq('user_id', user!.id)

      if (updateError) {
        if (updateError.code === '23505') {
          setPhoneError('This phone number is already registered')
        } else {
          setError(updateError.message || 'Failed to update profile')
        }
        setLoading(false)
        return
      }

      await refreshProfile()
      setSuccess(true)
      setLoading(false)

      setTimeout(() => {
        router.push('/account')
      }, 1500)
    } catch (err) {
      console.error('Profile update error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleEmailChange = async () => {
    setEmailChangeError('')
    setEmailChangeMessage('')

    // Validate email format
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailChangeError('Please enter a valid email address')
      return
    }

    // Check if it's the same as current email
    if (newEmail === user?.email) {
      setEmailChangeError('This is already your current email address')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })

      if (error) {
        console.error('Email change error:', error)
        setEmailChangeError(error.message || 'Failed to change email')
        return
      }

      setEmailChangeMessage(`Verification email sent to ${newEmail}. Please check your inbox and verify to complete the email change.`)
      setNewEmail('')
      setShowEmailChange(false)
    } catch (err) {
      console.error('Email change error:', err)
      setEmailChangeError('An unexpected error occurred')
    }
  }

  if (authLoading || !userProfile) {
    return (
      <div className={accountStyles.container}>
        <div className={accountStyles.emptyState}>
          <div className={accountStyles.emptyStateIcon}>⏳</div>
          <div className={accountStyles.emptyStateText}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/account" style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.875rem', display: 'block', marginBottom: '1rem' }}>
            ← Back to Account
          </Link>
          <h1 className={styles.title}>Edit Profile</h1>
          <p className={styles.subtitle}>Update your personal information</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorText}>{error}</div>}
          {success && (
            <div className={styles.success}>
              Profile updated successfully! Redirecting...
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={user!.email || ''}
              className={styles.input}
              disabled
              style={{ backgroundColor: '#f7fafc', cursor: 'not-allowed' }}
            />
            {emailChangeMessage && (
              <div className={styles.success} style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                {emailChangeMessage}
              </div>
            )}
            {!showEmailChange ? (
              <button
                type="button"
                onClick={() => setShowEmailChange(true)}
                className={styles.link}
                style={{ marginTop: '0.5rem', fontSize: '0.875rem', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
              >
                Change Email
              </button>
            ) : (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '0.5rem' }}>
                <label htmlFor="newEmail" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  New Email Address
                </label>
                <input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Enter new email address"
                  style={{ marginBottom: '0.75rem' }}
                />
                {emailChangeError && (
                  <div className={styles.errorText} style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                    {emailChangeError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleEmailChange}
                    className={styles.button}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem' }}
                  >
                    Send Verification Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailChange(false)
                      setNewEmail('')
                      setEmailChangeError('')
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      background: '#e2e8f0',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter your full name"
              required
              minLength={2}
              autoComplete="name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>
              Phone Number * (Indian)
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`${styles.input} ${phoneError ? styles.error : ''}`}
              placeholder="9876543210"
              required
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              autoComplete="tel"
            />
            {phoneError && <div className={styles.errorText}>{phoneError}</div>}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading || success}
          >
            {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
