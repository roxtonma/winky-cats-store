/**
 * Form Validation Utilities
 *
 * Centralized validation functions for form inputs across the application.
 */

import { config } from './config'

export type ValidationResult = {
  isValid: boolean
  error?: string
}

/**
 * Validate Indian mobile phone number
 * Format: 10 digits starting with 6-9
 */
export function validatePhone(phone: string): ValidationResult {
  const cleaned = phone.trim().replace(/\s+/g, '')

  if (!cleaned) {
    return { isValid: false, error: 'Phone number is required' }
  }

  if (!config.validation.phone.pattern.test(cleaned)) {
    return { isValid: false, error: config.validation.phone.message }
  }

  return { isValid: true }
}

/**
 * Validate Indian postal code
 * Format: 6 digits
 */
export function validatePostalCode(postalCode: string): ValidationResult {
  const cleaned = postalCode.trim()

  if (!cleaned) {
    return { isValid: false, error: 'Postal code is required' }
  }

  if (!config.validation.postalCode.pattern.test(cleaned)) {
    return { isValid: false, error: config.validation.postalCode.message }
  }

  return { isValid: true }
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const cleaned = email.trim()

  if (!cleaned) {
    return { isValid: false, error: 'Email is required' }
  }

  if (!config.validation.email.pattern.test(cleaned)) {
    return { isValid: false, error: config.validation.email.message }
  }

  return { isValid: true }
}

/**
 * Validate required text field
 */
export function validateRequired(
  value: string,
  fieldName: string
): ValidationResult {
  const cleaned = value.trim()

  if (!cleaned) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  return { isValid: true }
}

/**
 * Validate all shipping form fields at once
 */
export type ShippingFormData = {
  name: string
  email: string
  phone: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
}

export type ShippingFormErrors = Partial<Record<keyof ShippingFormData, string>>

export function validateShippingForm(
  formData: ShippingFormData
): { isValid: boolean; errors: ShippingFormErrors } {
  const errors: ShippingFormErrors = {}

  // Validate name
  const nameResult = validateRequired(formData.name, 'Name')
  if (!nameResult.isValid) errors.name = nameResult.error

  // Validate email
  const emailResult = validateEmail(formData.email)
  if (!emailResult.isValid) errors.email = emailResult.error

  // Validate phone
  const phoneResult = validatePhone(formData.phone)
  if (!phoneResult.isValid) errors.phone = phoneResult.error

  // Validate address
  const addressResult = validateRequired(formData.addressLine1, 'Address')
  if (!addressResult.isValid) errors.addressLine1 = addressResult.error

  // Validate city
  const cityResult = validateRequired(formData.city, 'City')
  if (!cityResult.isValid) errors.city = cityResult.error

  // Validate state
  const stateResult = validateRequired(formData.state, 'State')
  if (!stateResult.isValid) errors.state = stateResult.error

  // Validate postal code
  const postalCodeResult = validatePostalCode(formData.postalCode)
  if (!postalCodeResult.isValid) errors.postalCode = postalCodeResult.error

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
