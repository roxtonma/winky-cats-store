/**
 * Centralized Application Configuration
 *
 * All hardcoded business logic values should be defined here
 * for easy maintenance and consistency across the application.
 */

export const config = {
  /**
   * E-Commerce Settings
   */
  shipping: {
    freeShippingThreshold: 1000, // Free shipping for orders above ₹1000
    defaultShippingCost: 0, // Default shipping cost in ₹
  },

  /**
   * Try-On Feature Limits
   */
  tryOn: {
    // IP-based limits (for anonymous users)
    ipLimitPerDay: 2, // Max try-ons per IP per day
    ipLimitWindow: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

    // User-based limits (for authenticated users)
    verifiedUserLimit: 2, // Max try-ons for verified users without purchase
    purchasedUserLimit: Infinity, // Unlimited for users who made a purchase

    // Processing limits
    maxImageSize: 10 * 1024 * 1024, // 10MB max file size
    maxDimension: 3840, // 4K max dimension
  },

  /**
   * Rate Limiting Settings
   */
  rateLimits: {
    // Payment verification endpoint
    paymentVerification: {
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },

    // Order creation endpoint
    orderCreation: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },

    // Try-on generation endpoint
    tryOnGeneration: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
  },

  /**
   * Form Validation Patterns
   */
  validation: {
    phone: {
      pattern: /^[6-9]\d{9}$/, // Indian mobile number (10 digits starting with 6-9)
      message: 'Please enter a valid 10-digit Indian mobile number',
    },
    postalCode: {
      pattern: /^\d{6}$/, // Indian postal code (6 digits)
      message: 'Please enter a valid 6-digit postal code',
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
  },

  /**
   * Payment Gateway Settings
   */
  payment: {
    currency: 'INR',
    provider: 'Razorpay',
    theme: {
      color: '#3399cc',
    },
  },

  /**
   * Product Settings
   */
  products: {
    defaultImageQuality: 80,
    thumbnailSize: 300,
  },
} as const

export type Config = typeof config
