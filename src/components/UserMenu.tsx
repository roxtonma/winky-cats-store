'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from './styles/UserMenu.module.css'

export function UserMenu() {
  const router = useRouter()
  const { user, userProfile, loading, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
    router.push('/')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton}></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Link href="/login" className={styles.loginButton}>
        Login
      </Link>
    )
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className={styles.userIcon}>
          {userProfile ? getInitials(userProfile.name) : 'U'}
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {userProfile && (
            <div className={styles.userInfo}>
              <div className={styles.userName}>{userProfile.name}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          )}

          <div className={styles.menuItems}>
            <Link
              href="/account"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              My Account
            </Link>

            <Link
              href="/account/orders"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              My Orders
            </Link>

            <button
              className={styles.menuItem}
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
