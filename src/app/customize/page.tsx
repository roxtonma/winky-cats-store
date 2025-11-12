'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import styles from './customize.module.css'

export default function CustomizePage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    productType: 't-shirt',
    designBrief: '',
    name: '',
    email: '',
    phone: '',
    budget: '399-499',
    referenceImages: null as FileList | null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        referenceImages: e.target.files,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Basic validation
    if (!formData.designBrief.trim()) {
      toast.error('Please tell us about your design idea')
      setIsSubmitting(false)
      return
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please provide your contact information')
      setIsSubmitting(false)
      return
    }

    try {
      let imageUrls: string[] = []

      // Upload images first if any are selected
      if (formData.referenceImages && formData.referenceImages.length > 0) {
        toast.info('Uploading images...')

        const uploadFormData = new FormData()
        Array.from(formData.referenceImages).forEach((file) => {
          uploadFormData.append('images', file)
        })

        const uploadResponse = await fetch('/api/upload-reference-images', {
          method: 'POST',
          body: uploadFormData,
        })

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload images')
        }

        imageUrls = uploadData.urls
      }

      // Submit to API
      const response = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productType: formData.productType,
          designBrief: formData.designBrief,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          budget: formData.budget,
          userId: user?.id || null,
          referenceImageCount: imageUrls.length,
          referenceImageUrls: imageUrls,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      // Success
      toast.success("Request submitted! We'll get back to you within 24 hours.")

      // Reset form
      setFormData({
        productType: 't-shirt',
        designBrief: '',
        name: '',
        email: '',
        phone: '',
        budget: '399-499',
        referenceImages: null,
      })

      // Reset file input
      const fileInput = document.getElementById('referenceImages') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error) {
      console.error('Error submitting custom request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Your Custom Design</h1>
          <p className={styles.subtitle}>
            Tell us what you want, and we&apos;ll bring it to life. We&apos;ll get back to you within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>What do you want to customize?</h2>

            <div className={styles.formGroup}>
              <label htmlFor="productType" className={styles.label}>
                Product Type *
              </label>
              <select
                id="productType"
                name="productType"
                value={formData.productType}
                onChange={handleInputChange}
                className={styles.select}
                required
              >
                <option value="t-shirt">T-Shirt</option>
                <option value="hoodie">Hoodie</option>
                <option value="notebook">Notebook</option>
                <option value="phone-cover">Phone Cover</option>
                <option value="tote-bag">Tote Bag</option>
                <option value="mug">Mug</option>
                <option value="stickers">Stickers</option>
                <option value="other">Other (mention in description)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="designBrief" className={styles.label}>
                Design Brief *
              </label>
              <textarea
                id="designBrief"
                name="designBrief"
                value={formData.designBrief}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Describe your design idea ... What colors do you want? What style? Any text or graphics? Be as detailed as possible!"
                rows={6}
                required
              />
              <span className={styles.helperText}>
                The more details you provide, the better we can match your vision
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="referenceImages" className={styles.label}>
                Reference Images (Optional)
              </label>
              <input
                type="file"
                id="referenceImages"
                name="referenceImages"
                onChange={handleFileChange}
                className={styles.fileInput}
                accept="image/*"
                multiple
              />
              <span className={styles.helperText}>
                Upload any inspiration images or sketches
              </span>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Your Budget</h2>

            <div className={styles.formGroup}>
              <label htmlFor="budget" className={styles.label}>
                Budget Range *
              </label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className={styles.select}
                required
              >
                <option value="399-499">₹399 - ₹499 (Basic)</option>
                <option value="500-699">₹500 - ₹699 (Standard)</option>
                <option value="700-999">₹700 - ₹999 (Premium)</option>
                <option value="1000+">₹1000+ (Custom)</option>
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Contact Information</h2>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Custom Request'}
            </button>
            <p className={styles.responseTime}>
              We&apos;ll review your request and get back to you within 24 hours!
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
