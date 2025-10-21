'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { validatePhone } from '@/lib/validation'
import styles from '../../login/page.module.css'

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, userProfile, refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login')
      return
    }

    // Redirect if profile already exists
    if (userProfile) {
      router.push('/account')
    }
  }, [user, userProfile, router])

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    setPhoneError('')

    // Validate on change if there's already an error
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

    // Validate phone
    const phoneValidation = validatePhone(phone)
    if (!phoneValidation.isValid) {
      setPhoneError('Enter a valid 10-digit Indian phone number starting with 6-9')
      return
    }

    // Validate name
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setLoading(true)

    try {
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user!.id,
          phone_number: phone,
          name: name.trim(),
          email: user!.email,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        if (profileError.code === '23505') {
          // Unique constraint violation
          setPhoneError('This phone number is already registered')
        } else if (profileError.code === '42P01') {
          // Table does not exist
          setError('Database not set up. Please run the migrations first.')
        } else {
          setError(profileError.message || 'Failed to create profile')
        }
        setLoading(false)
        return
      }

      // Refresh the user profile in context
      await refreshProfile()

      // Redirect to account page
      router.push('/account')
    } catch (err) {
      console.error('Profile setup error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Complete Your Profile</h1>
          <p className={styles.subtitle}>
            We need your name and phone number to process orders
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Full Name*
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
              Phone Number*
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
            <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
              Must be a 10-digit Indian number
            </p>
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
