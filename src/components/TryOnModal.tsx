'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import styles from './styles/TryOnModal.module.css'
import { ImageCaptureUpload } from './ImageCaptureUpload'

type TryOnModalProps = {
  isOpen: boolean
  onClose: () => void
  productName: string
  productImages: string[]
  selectedColor?: string
  customPrompt?: string
}

type TryOnState = 'input' | 'processing' | 'results'

type TryOnResult = {
  images: Array<{ url: string }>
  seed: number
  remaining?: number
  totalUsed?: number
}

export function TryOnModal({
  isOpen,
  onClose,
  productName,
  productImages,
  selectedColor,
  customPrompt
}: TryOnModalProps) {
  const { user } = useAuth()
  const [state, setState] = useState<TryOnState>('input')
  const [userImage, setUserImage] = useState<{ url: string; file: File; width: number; height: number } | null>(null)
  const [results, setResults] = useState<TryOnResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingLogs, setProcessingLogs] = useState<string[]>([])

  const handleImageSelected = (url: string, file: File) => {
    // Load image to get dimensions
    const img = new Image()
    img.onload = () => {
      const MAX_DIMENSION = 3840

      // Try to 2x the image for better quality
      let targetWidth = img.width * 2
      let targetHeight = img.height * 2

      // If 2x exceeds max, scale down proportionally
      if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        const scale = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight)
        targetWidth = Math.round(targetWidth * scale)
        targetHeight = Math.round(targetHeight * scale)
      }

      setUserImage({ url, file, width: targetWidth, height: targetHeight })
      setError(null)
    }
    img.src = url
  }

  const handleTryOn = async () => {
    if (!userImage) {
      setError('Please select or capture an image first')
      return
    }

    setState('processing')
    setError(null)
    setProcessingLogs(['Uploading your image...'])

    try {
      // Upload image file directly using FormData
      const formData = new FormData()
      formData.append('file', userImage.file)
      formData.append('productImages', JSON.stringify(productImages))
      formData.append('productName', productName)
      formData.append('imageWidth', userImage.width.toString())
      formData.append('imageHeight', userImage.height.toString())
      if (selectedColor) {
        formData.append('selectedColor', selectedColor)
      }
      if (customPrompt) {
        formData.append('customPrompt', customPrompt)
      }
      if (user?.id) {
        formData.append('userId', user.id)
      }

      setProcessingLogs(prev => [...prev, 'Generating try-on...'])

      // Call try-on API with FormData
      const tryOnResponse = await fetch('/api/try-on', {
        method: 'POST',
        body: formData
      })

      if (!tryOnResponse.ok) {
        const errorData = await tryOnResponse.json()
        throw new Error(errorData.error || 'Failed to generate try-on')
      }

      const result = await tryOnResponse.json()
      console.log('Try-on result received:', result)

      if (!result.images || result.images.length === 0) {
        throw new Error('No images in response')
      }

      setResults(result)
      setState('results')

      // Show remaining attempts info
      if (result.remaining !== undefined) {
        setProcessingLogs(prev => [
          ...prev,
          `Try-on generated successfully! ${result.remaining} attempts remaining today.`
        ])
      } else {
        setProcessingLogs(prev => [...prev, 'Try-on generated successfully!'])
      }

    } catch (err) {
      console.error('Try-on error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'

      // Check if it's a rate limit error
      if (errorMessage.includes('limit') || errorMessage.includes('Rate limit')) {
        setError(errorMessage)
      } else {
        setError(errorMessage)
      }

      setState('input')
      setProcessingLogs([])
    }
  }

  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `try-on-${productName.replace(/\s+/g, '-').toLowerCase()}-${index + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download image')
    }
  }

  const resetModal = () => {
    setState('input')
    setUserImage(null)
    setResults(null)
    setError(null)
    setProcessingLogs([])
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        <div className={styles.content}>
          <h2 className={styles.title}>Virtual Try-On</h2>
          <p className={styles.subtitle}>See how {productName} looks on you!</p>

          {state === 'input' && (
            <>
              <ImageCaptureUpload onImageSelected={handleImageSelected} />

              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}

              <div className={styles.actions}>
                <button
                  onClick={handleTryOn}
                  disabled={!userImage}
                  className={styles.tryOnBtn}
                >
                  Generate Try-On
                </button>
              </div>
            </>
          )}

          {state === 'processing' && (
            <div className={styles.processing}>
              <div className={styles.spinner} />
              <h3>Generating your try-on...</h3>
              <p>This may take 30-60 seconds</p>

              <div className={styles.logs}>
                {processingLogs.map((log, index) => (
                  <div key={index} className={styles.logItem}>
                    <span className={styles.logDot} />
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {state === 'results' && results && (
            <div className={styles.results}>
              <h3>Your Try-On Results</h3>

              {results.remaining !== undefined && (
                <div style={{
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: results.remaining > 0 ? '#e7f5ff' : '#ffe7e7',
                  borderRadius: '8px',
                  color: results.remaining > 0 ? '#0066cc' : '#cc0000',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}>
                  {results.remaining > 0
                    ? `${results.remaining} try-on${results.remaining !== 1 ? 's' : ''} remaining today`
                    : 'Daily limit reached. Try again tomorrow!'}
                </div>
              )}

              <div className={styles.resultImages}>
                {results.images.map((image, index) => (
                  <div key={index} className={styles.resultImage}>
                    <img src={image.url} alt={`Try-on result ${index + 1}`} />
                    <button
                      onClick={() => downloadImage(image.url, index)}
                      className={styles.downloadBtn}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Download
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.resultActions}>
                <button onClick={resetModal} className={styles.tryAgainBtn}>
                  Try Again
                </button>
                <button onClick={onClose} className={styles.doneBtn}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
