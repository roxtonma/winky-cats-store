'use client'

import { useState } from 'react'
import Image from 'next/image'
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
      <Image
        src={isHovered ? '/logos/winky-cats-hover.svg' : '/logos/winky-cats-default.svg'}
        alt="Winky Cats"
        width={120}
        height={40}
        className={styles.logoImage}
        priority
      />
    </div>
  )
}
