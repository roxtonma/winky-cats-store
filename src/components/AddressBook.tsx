'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, UserAddress } from '@/lib/supabase'
import { validatePhone, validatePostalCode } from '@/lib/validation'
import styles from './styles/AddressBook.module.css'

type AddressBookProps = {
  addresses: UserAddress[]
  onUpdate: () => void
}

type AddressFormData = {
  label: string
  full_name: string
  phone_number: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  is_default: boolean
}

const emptyForm: AddressFormData = {
  label: '',
  full_name: '',
  phone_number: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  is_default: false,
}

export function AddressBook({ addresses, onUpdate }: AddressBookProps) {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)
  const [formData, setFormData] = useState<AddressFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  const openModal = (address?: UserAddress) => {
    if (address) {
      setEditingAddress(address)
      setFormData({
        label: address.label || '',
        full_name: address.full_name,
        phone_number: address.phone_number,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || '',
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        is_default: address.is_default,
      })
    } else {
      setEditingAddress(null)
      setFormData(emptyForm)
    }
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAddress(null)
    setFormData(emptyForm)
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AddressFormData, string>> = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Name is required'
    }

    const phoneValidation = validatePhone(formData.phone_number)
    if (!phoneValidation.isValid) {
      newErrors.phone_number = 'Enter a valid 10-digit Indian phone number'
    }

    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    const postalValidation = validatePostalCode(formData.postal_code)
    if (!postalValidation.isValid) {
      newErrors.postal_code = 'Enter a valid 6-digit PIN code'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    try {
      const addressData = {
        user_id: user!.id,
        label: formData.label.trim() || null,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number,
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postal_code: formData.postal_code,
        country: 'India',
        is_default: formData.is_default,
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', editingAddress.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_addresses')
          .insert(addressData)

        if (error) throw error
      }

      onUpdate()
      closeModal()
    } catch (error) {
      console.error('Error saving address:', error)
      alert('Failed to save address. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)

      if (error) throw error

      onUpdate()
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('Failed to delete address. Please try again.')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)

      if (error) throw error

      onUpdate()
    } catch (error) {
      console.error('Error setting default address:', error)
      alert('Failed to set default address. Please try again.')
    }
  }

  return (
    <div className={styles.container}>
      <button className={styles.addButton} onClick={() => openModal()}>
        + Add New Address
      </button>

      {addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateTitle}>
            No addresses yet
          </div>
          <p className={styles.emptyStateDescription}>
            Add your first address to speed up checkout
          </p>
        </div>
      ) : (
        addresses.map((address) => (
          <div
            key={address.id}
            className={`${styles.addressCard} ${address.is_default ? styles.default : ''}`}
          >
            {address.is_default && (
              <div className={styles.defaultBadge}>Default</div>
            )}

            <div className={styles.addressLabel}>
              {address.label || 'Address'}
            </div>

            <div className={styles.addressDetails}>
              <div><strong>{address.full_name}</strong></div>
              <div>{address.phone_number}</div>
              <div style={{ marginTop: '0.5rem' }}>
                {address.address_line1}
                {address.address_line2 && <>, {address.address_line2}</>}
              </div>
              <div>
                {address.city}, {address.state} - {address.postal_code}
              </div>
              <div>{address.country}</div>
            </div>

            <div className={styles.addressActions}>
              <button
                className={`${styles.actionButton} ${styles.edit}`}
                onClick={() => openModal(address)}
              >
                Edit
              </button>
              {!address.is_default && (
                <button
                  className={`${styles.actionButton} ${styles.setDefault}`}
                  onClick={() => handleSetDefault(address.id)}
                >
                  Set as Default
                </button>
              )}
              <button
                className={`${styles.actionButton} ${styles.delete}`}
                onClick={() => handleDelete(address.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {isModalOpen && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalHeader}>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Label (Optional)
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Home, Office, etc."
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name *</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.full_name ? styles.error : ''}`}
                  placeholder="Enter full name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
                {errors.full_name && <div className={styles.errorText}>{errors.full_name}</div>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number *</label>
                <input
                  type="tel"
                  className={`${styles.input} ${errors.phone_number ? styles.error : ''}`}
                  placeholder="9876543210"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  maxLength={10}
                  required
                />
                {errors.phone_number && <div className={styles.errorText}>{errors.phone_number}</div>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Address Line 1 *</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.address_line1 ? styles.error : ''}`}
                  placeholder="House no., Building name, Street"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  required
                />
                {errors.address_line1 && <div className={styles.errorText}>{errors.address_line1}</div>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Address Line 2</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Area, Landmark"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>City *</label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.city ? styles.error : ''}`}
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                  {errors.city && <div className={styles.errorText}>{errors.city}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>State *</label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.state ? styles.error : ''}`}
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                  {errors.state && <div className={styles.errorText}>{errors.state}</div>}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>PIN Code *</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.postal_code ? styles.error : ''}`}
                  placeholder="123456"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  maxLength={6}
                  required
                />
                {errors.postal_code && <div className={styles.errorText}>{errors.postal_code}</div>}
              </div>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
                Set as default address
              </label>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingAddress ? 'Update' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
