'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CartIcon from '@/components/CartIcon';
import { UserMenu } from '@/components/UserMenu';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import styles from './styles/Sidebar.module.css';

// ============================================
// LOGO CONFIGURATION
// ============================================
// Set to true to use SVG logo, false to use text "Winky Cats"
const USE_SVG_LOGO = false;

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, userProfile } = useAuth();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle scroll to show/hide navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show

      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
        return; // Don't update if scroll change is too small
      }

      if (currentScrollY < 50) {
        // Always show navbar when near the top
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide navbar
        setIsNavVisible(false);
      } else {
        // Scrolling up - show navbar
        setIsNavVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener);

    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, [lastScrollY]);

  return (
    <>
      <nav className={`${styles.nav} ${isNavVisible ? styles.navVisible : styles.navHidden}`}>
        <div className={styles.navContainer}>
          {/* Left: Logo Section */}
          <div className={styles.logoSection}>
            <Link href="/" className={styles.logo}>
              {USE_SVG_LOGO ? (
                <Logo className={styles.mobileLogo} />
              ) : (
                <span className={styles.logoText}>Winky Cats</span>
              )}
            </Link>
          </div>

          {/* Right: Navigation Section */}
          <div className={styles.navSection}>
            {/* Mobile: Hamburger button */}
            <button
              className={styles.hamburger}
              onClick={toggleSidebar}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
              <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
              <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
            </button>

            {/* Desktop: Right-aligned nav, auth and cart */}
            <div className={styles.rightNavLinks}>
              <Link href="/products" className={styles.navLink}>
                Our Products
              </Link>
              <Link href="/customize" className={styles.navLink}>
                Custom Design
              </Link>
              <Link href="/associates" className={styles.navLink}>
                Affiliate Products
              </Link>
              <UserMenu />
              <CartIcon />
            </div>

            {/* Mobile: Cart icon only */}
            <div className={styles.mobileCartIcon}>
              <CartIcon />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile: Overlay */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile: Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link
            href={user ? "/account" : "/login"}
            className={styles.profileHeader}
            onClick={closeSidebar}
          >
            <div className={styles.profileIcon}>
              {user && userProfile ? getInitials(userProfile.name) : 'U'}
            </div>
            <span className={styles.profileHint}>My Profile</span>
          </Link>
          <button
            className={styles.closeButton}
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <Link
            href="/"
            className={styles.sidebarLink}
            onClick={closeSidebar}
          >
            Home
          </Link>

          <Link
            href="/products"
            className={styles.sidebarLink}
            onClick={closeSidebar}
          >
            Our Products
          </Link>
          <Link
            href="/customize"
            className={styles.sidebarLink}
            onClick={closeSidebar}
          >
            Custom Design
          </Link>
          <Link
            href="/associates"
            className={styles.sidebarLink}
            onClick={closeSidebar}
          >
            Affiliate Products
          </Link>

          <div className={styles.divider}></div>

          <div className={styles.sidebarSection}>
            <span className={styles.sectionLabel}>Help & Policies</span>
            <Link
              href="/contact"
              className={styles.sidebarLink}
              onClick={closeSidebar}
            >
              Contact Us
            </Link>
            <Link
              href="/shipping-returns"
              className={styles.sidebarLink}
              onClick={closeSidebar}
            >
              Shipping & Returns
            </Link>
            <Link
              href="/terms"
              className={styles.sidebarLink}
              onClick={closeSidebar}
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy"
              className={styles.sidebarLink}
              onClick={closeSidebar}
            >
              Privacy Policy
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
