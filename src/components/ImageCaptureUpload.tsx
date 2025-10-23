'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import styles from './styles/ImageCaptureUpload.module.css'

type ImageCaptureUploadProps = {
  onImageSelected: (imageUrl: string, file: File) => void
}

export function ImageCaptureUpload({ onImageSelected }: ImageCaptureUploadProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      onImageSelected(url, file)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      setStream(mediaStream)
      setIsCameraActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsCameraActive(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' })
            setPreviewUrl(url)
            onImageSelected(url, file)
            stopCamera()
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  const handleTabChange = (tab: 'upload' | 'camera') => {
    setActiveTab(tab)
    if (tab === 'upload') {
      stopCamera()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'upload' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('upload')}
        >
          Upload Photo
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'camera' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('camera')}
        >
          Take Photo
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'upload' && (
          <div className={styles.uploadSection}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className={styles.fileInput}
              id="image-upload"
            />
            <label htmlFor="image-upload" className={styles.uploadLabel}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Click to upload or drag and drop</span>
              <span className={styles.uploadHint}>PNG, JPG up to 10MB</span>
            </label>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className={styles.cameraSection}>
            {!isCameraActive ? (
              <button onClick={startCamera} className={styles.startCameraBtn}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Start Camera
              </button>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={styles.video}
                />
                <div className={styles.cameraControls}>
                  <button onClick={capturePhoto} className={styles.captureBtn}>
                    Capture Photo
                  </button>
                  <button onClick={stopCamera} className={styles.cancelBtn}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {previewUrl && (
          <div className={styles.preview}>
            <h4>Preview:</h4>
            <Image
              src={previewUrl}
              alt="Preview"
              width={400}
              height={400}
              className={styles.previewImage}
              unoptimized
            />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
