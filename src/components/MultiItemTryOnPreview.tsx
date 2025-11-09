'use client'

import { useState } from 'react'
import { CharacterOutfit } from '@/types/customizer'
import Image from 'next/image'
import { ImageCaptureUpload } from './ImageCaptureUpload'
import styles from './styles/MultiItemTryOnPreview.module.css'

interface MultiItemTryOnPreviewProps {
  outfit: CharacterOutfit
}

interface TryOnResult {
  images: Array<{ url: string }>
  remaining: number
  totalUsed: number
}

export default function MultiItemTryOnPreview({ outfit }: MultiItemTryOnPreviewProps) {
  const [userImage, setUserImage] = useState<File | null>(null)
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null)
  const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelect = (imageUrl: string, file: File) => {
    setUserImage(file)
    setUserImagePreview(imageUrl)
    setTryOnResult(null)
    setError(null)
  }

  const getSelectedItems = () => {
    const items = []
    if (outfit.head.product) items.push({ ...outfit.head.product, slot: 'head' })
    if (outfit.innerTops.product) items.push({ ...outfit.innerTops.product, slot: 'inner-tops' })
    if (outfit.outerTops.product) items.push({ ...outfit.outerTops.product, slot: 'outer-tops' })
    if (outfit.bottoms.product) items.push({ ...outfit.bottoms.product, slot: 'bottoms' })
    if (outfit.shoes.product) items.push({ ...outfit.shoes.product, slot: 'shoes' })
    outfit.accessories.forEach((acc, idx) => {
      if (acc.product) items.push({ ...acc.product, slot: `accessory-${idx}` })
    })
    return items
  }

  const handleGenerateTryOn = async () => {
    if (!userImage) {
      setError('Please upload your image first')
      return
    }

    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) {
      setError('Please select at least one item')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', userImage)
      formData.append('items', JSON.stringify(selectedItems))

      const response = await fetch('/api/try-on-multi', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate try-on')
      }

      setTryOnResult(data)
    } catch (err) {
      console.error('Try-on error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate try-on. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Try-On Preview</h3>

      {!userImagePreview ? (
        <div className={styles.uploadArea}>
          <ImageCaptureUpload
            onImageSelected={handleImageSelect}
          />
          <p className={styles.uploadHint}>
            Upload or capture a photo to see how the selected items look on you
          </p>
        </div>
      ) : (
        <div className={styles.previewArea}>
          <div className={styles.imageDisplay}>
            {tryOnResult && tryOnResult.images.length > 0 ? (
              <Image
                src={tryOnResult.images[0].url}
                alt="Try-on result"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <Image
                src={userImagePreview}
                alt="Your photo"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                style={{ objectFit: 'contain' }}
              />
            )}
          </div>

          <div className={styles.controls}>
            <button
              className={styles.generateButton}
              onClick={handleGenerateTryOn}
              disabled={isGenerating || getSelectedItems().length === 0}
            >
              {isGenerating ? (
                <>
                  <div className={styles.spinner} />
                  Generating...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 1 0 10 10" />
                    <path d="M22 12a10 10 0 0 1-10 10" />
                  </svg>
                  Generate Try-On
                </>
              )}
            </button>

            <button
              className={styles.changeButton}
              onClick={() => {
                setUserImage(null)
                setUserImagePreview(null)
                setTryOnResult(null)
                setError(null)
              }}
            >
              Change Photo
            </button>
          </div>

          {tryOnResult && (
            <p className={styles.remainingText}>
              Remaining tries: {tryOnResult.remaining}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}
