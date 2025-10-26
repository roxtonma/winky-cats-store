'use client'

import { useState } from 'react'
import styles from './styles/Logo.module.css'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`${styles.logoContainer} ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={isHovered ? '/logos/winky-cats-hover.svg' : '/logos/winky-cats-default.svg'}
        alt="Winky Cats"
        className={styles.logoImage}
      />
    </div>
  )
}
