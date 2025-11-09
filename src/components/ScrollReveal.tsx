'use client'

import { useRef, ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

/**
 * ScrollReveal Component
 *
 * Animates children with fade & scale effect when they scroll into view
 *
 * Props:
 * - delay: Animation delay in seconds (default: 0)
 * - duration: Animation duration in seconds (default: 0.6)
 * - className: Optional CSS class to apply to the wrapper
 */
export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.6,
  className = ''
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true, // Animate only once
    amount: 0.2 // Trigger when 20% of element is visible
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1] // Custom ease-out curve
      }}
      className={className}
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </motion.div>
  )
}
