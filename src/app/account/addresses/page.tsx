'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, UserAddress } from '@/lib/supabase'
import { AddressBook } from '@/components/AddressBook'
import styles from '../page.module.css'

export default function AddressesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchAddresses()
    }
  }, [user, authLoading, router])

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⏳</div>
          <div className={styles.emptyStateText}>Loading addresses...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/account" style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Back to Account
        </Link>
        <h1 className={styles.title}>My Addresses</h1>
        <p className={styles.subtitle}>Manage your delivery addresses</p>
      </div>

      <AddressBook
        addresses={addresses}
        onUpdate={fetchAddresses}
      />
    </div>
  )
}
