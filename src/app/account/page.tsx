'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { AddressBook } from '@/components/AddressBook'
import { supabase, UserAddress } from '@/lib/supabase'
import { validatePhone } from '@/lib/validation'
import styles from './page.module.css'

export default function AccountPage() {
  const router = useRouter()
  const { user, userProfile, loading, signOut, refreshProfile } = useAuth()
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    phone_number: '',
  })
  const [profileErrors, setProfileErrors] = useState<{ name?: string; phone_number?: string }>({})
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Debug logging
  console.log('[AccountPage] Auth state:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    hasProfile: !!userProfile,
    profileName: userProfile?.name
  })

  useEffect(() => {
    console.log('[AccountPage] useEffect triggered:', { loading, hasUser: !!user, hasProfile: !!userProfile })

    if (!loading && !user) {
      console.log('[AccountPage] No user, redirecting to /login')
      router.push('/login')
    } else if (!loading && user && !userProfile) {
      console.log('[AccountPage] User but no profile, redirecting to /account/setup')
      router.push('/account/setup')
    }
  }, [user, userProfile, loading, router])

  // Load addresses
  const loadAddresses = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadAddresses()
    }
  }, [user, loadAddresses])

  // Initialize profile form data when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setProfileFormData({
        name: userProfile.name,
        phone_number: userProfile.phone_number,
      })
    }
  }, [userProfile])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleEditProfile = () => {
    setIsEditingProfile(true)
    setProfileErrors({})
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    if (userProfile) {
      setProfileFormData({
        name: userProfile.name,
        phone_number: userProfile.phone_number,
      })
    }
    setProfileErrors({})
  }

  const validateProfile = (): boolean => {
    const newErrors: { name?: string; phone_number?: string } = {}

    if (!profileFormData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    const phoneValidation = validatePhone(profileFormData.phone_number)
    if (!phoneValidation.isValid) {
      newErrors.phone_number = 'Enter a valid 10-digit Indian phone number'
    }

    setProfileErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validateProfile() || !user) return

    setIsUpdatingProfile(true)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: profileFormData.name.trim(),
          phone_number: profileFormData.phone_number,
        })
        .eq('user_id', user.id)

      if (error) throw error

      // Refresh the profile in context without reloading page
      await refreshProfile()
      setIsEditingProfile(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  if (loading || !user || !userProfile) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⏳</div>
          <div className={styles.emptyStateText}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Account</h1>
        <p className={styles.subtitle}>Manage your profile and orders</p>
      </div>

      <div className={styles.contentWrapper}>
        {/* Profile Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Profile Information</h2>
            {!isEditingProfile && (
              <button onClick={handleEditProfile} className={styles.editButton}>
                Edit
              </button>
            )}
          </div>

          <div className={styles.profileCard}>
            {isEditingProfile ? (
              <div className={styles.editForm}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name</label>
                  <input
                    type="text"
                    className={`${styles.input} ${profileErrors.name ? styles.error : ''}`}
                    value={profileFormData.name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                  />
                  {profileErrors.name && <div className={styles.errorText}>{profileErrors.name}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    className={`${styles.input} ${profileErrors.phone_number ? styles.error : ''}`}
                    value={profileFormData.phone_number}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phone_number: e.target.value })}
                    maxLength={10}
                  />
                  {profileErrors.phone_number && <div className={styles.errorText}>{profileErrors.phone_number}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={user.email || ''}
                    disabled
                  />
                  <div className={styles.helperText}>Email cannot be changed</div>
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={handleCancelEdit}
                    className={styles.cancelButton}
                    disabled={isUpdatingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className={styles.saveButton}
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.profileInfo}>
                <div className={styles.profileDetail}>
                  <span className={styles.detailLabel}>Name:</span>
                  <span className={styles.detailValue}>{userProfile.name}</span>
                </div>
                <div className={styles.profileDetail}>
                  <span className={styles.detailLabel}>Phone:</span>
                  <span className={styles.detailValue}>{userProfile.phone_number}</span>
                </div>
                <div className={styles.profileDetail}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{user.email}</span>
                </div>
                {userProfile.has_purchased && (
                  <div className={styles.profileDetail}>
                    <span className={styles.detailLabel}>Status:</span>
                    <span className={styles.detailValue}>Premium Member (Unlimited Try-Ons)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Addresses Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Delivery Addresses</h2>
          </div>
          <AddressBook addresses={addresses} onUpdate={loadAddresses} />
        </div>

        {/* Quick Links Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick Links</h2>
          </div>
          <div className={styles.quickLinks}>
            <Link href="/account/orders" className={styles.quickLinkCard}>
              <div className={styles.cardTitle}>My Orders</div>
              <div className={styles.cardDescription}>
                View and track your order history
              </div>
            </Link>
          </div>
        </div>

        {/* Sign Out Button */}
        <button onClick={handleSignOut} className={styles.signOutButton}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
