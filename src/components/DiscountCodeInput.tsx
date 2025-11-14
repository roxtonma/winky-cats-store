'use client'

import { useState } from 'react'
import styles from './styles/DiscountCodeInput.module.css'

interface DiscountCodeInputProps {
  onDiscountApplied: (discount: {
    code: string
    type: string
    value: number
    discountAmount: number
    message: string
  }) => void
  onDiscountRemoved: () => void
  orderAmount: number
  currentDiscount?: {
    code: string
    discountAmount: number
  } | null
}

export function DiscountCodeInput({
  onDiscountApplied,
  onDiscountRemoved,
  orderAmount,
  currentDiscount
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleApplyDiscount = async () => {
    if (!code.trim()) {
      setError('Please enter a discount code')
      return
    }

    setIsValidating(true)
    setError('')

    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.trim(),
          orderAmount
        })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        onDiscountApplied({
          code: data.code,
          type: data.type,
          value: data.value,
          discountAmount: data.discountAmount,
          message: data.message
        })
        setCode('')
        setError('')
      } else {
        setError(data.error || 'Invalid discount code')
      }
    } catch (err) {
      console.error('Error validating discount code:', err)
      setError('Failed to validate discount code. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveDiscount = () => {
    onDiscountRemoved()
    setCode('')
    setError('')
    setIsExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApplyDiscount()
    }
  }

  return (
    <div className={styles.container}>
      {currentDiscount ? (
        <div className={styles.appliedDiscount}>
          <div className={styles.appliedInfo}>
            <svg
              className={styles.checkIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div>
              <div className={styles.appliedCode}>{currentDiscount.code}</div>
              <div className={styles.appliedSavings}>
                You save ₹{currentDiscount.discountAmount.toFixed(2)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveDiscount}
            className={styles.removeButton}
            aria-label="Remove discount code"
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleButton}
          >
            <span>Have a discount code?</span>
            <svg
              className={`${styles.chevronIcon} ${isExpanded ? styles.chevronExpanded : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isExpanded && (
            <>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Enter discount code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  onKeyDown={handleKeyDown}
                  className={`${styles.input} ${error ? styles.inputError : ''}`}
                  disabled={isValidating}
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={isValidating || !code.trim()}
                  className={styles.applyButton}
                >
                  {isValidating ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {error && <div className={styles.errorMessage}>{error}</div>}
            </>
          )}
        </>
      )}
    </div>
  )
}
