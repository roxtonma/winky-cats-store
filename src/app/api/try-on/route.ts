import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { checkTryOnLimit, recordTryOnAttempt, getClientIp } from '@/lib/rateLimiter'
import { rateLimitError, validationError, externalApiError, internalError, logError } from '@/lib/errors'

// Configure Fal AI client
fal.config({
  credentials: process.env.FAL_KEY
})

// Type for Fal AI response
type FalAIResult = {
  images: Array<{ url: string }>
  seed: number
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Get user ID from request if authenticated
    const userId = formData.get('userId') as string | null
    const clientIp = getClientIp(request)

    // Determine identifier type and check limits
    let identifierType: 'ip' | 'user' = 'ip'
    let identifier = clientIp

    if (userId) {
      identifierType = 'user'
      identifier = userId
    }

    const limitCheck = await checkTryOnLimit(identifier, identifierType, userId || undefined)

    if (!limitCheck.allowed) {
      logError('Try-On Rate Limit', `${identifierType} ${identifier} exceeded try-on limit`, {
        remaining: limitCheck.remaining,
        totalUsed: limitCheck.totalUsed,
      })
      return rateLimitError(
        limitCheck.message || 'Try-on limit reached. Please try again later.'
      )
    }

    const file = formData.get('file') as File
    const productImagesStr = formData.get('productImages') as string
    const productName = formData.get('productName') as string
    const productId = formData.get('productId') as string | null
    const imageWidthStr = formData.get('imageWidth') as string | null
    const imageHeightStr = formData.get('imageHeight') as string | null
    const selectedColor = formData.get('selectedColor') as string | null
    const customPrompt = formData.get('customPrompt') as string | null

    if (!file) {
      return validationError('User image is required')
    }

    const productImages = JSON.parse(productImagesStr)

    // Parse dimensions with fallback to 4K landscape
    const imageWidth = imageWidthStr ? parseInt(imageWidthStr) : 3840
    const imageHeight = imageHeightStr ? parseInt(imageHeightStr) : 2160

    if (!productImages || productImages.length === 0) {
      return validationError('Product images are required')
    }

    // Build the prompt
    // Default prompt if no custom prompt provided
    const colorText = selectedColor ? ` in ${selectedColor} color` : ''
    const defaultPrompt = `Make the person wear the ${productName}${colorText}. Show the clothing fitting naturally on the person. Maintain the consistency by keeping the exact position of the clothing's design.`
    const prompt = customPrompt || defaultPrompt

    console.log('Starting Fal AI try-on with prompt:', prompt)

    // Upload File object to Fal storage
    const uploadedImageUrl = await fal.storage.upload(file)
    console.log('Uploaded user image to Fal:', uploadedImageUrl)

    // Prepare image URLs - use uploaded user image + only the first product image (front view)
    // Filter out size chart and back images, only keep the first front image
    const frontImage = productImages.find((img: string) =>
      img.toLowerCase().includes('front') ||
      (!img.toLowerCase().includes('back') && !img.toLowerCase().includes('size_chart'))
    ) || productImages[0]

    const imageUrls = [uploadedImageUrl, frontImage]

    console.log(`Using image dimensions: ${imageWidth}x${imageHeight}`)

    // Call Fal AI SeeDream Edit API
    const result = await fal.subscribe('fal-ai/bytedance/seedream/v4/edit', {
      input: {
        prompt: prompt,
        image_size: {
          height: imageHeight,
          width: imageWidth
        },
        num_images: 1,
        max_images: 1,
        enable_safety_checker: true,
        image_urls: imageUrls
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          const logs = update.logs?.map((log) => log.message) || []
          console.log('Fal AI progress:', logs)
        }
      }
    }) as FalAIResult

    console.log('Fal AI result:', result)

    if (!result.images || result.images.length === 0) {
      throw new Error('No images returned from Fal AI')
    }

    // Record the successful try-on attempt
    await recordTryOnAttempt(identifier, identifierType, productId || undefined, userId || undefined)

    // Return result with remaining attempts info
    const updatedLimit = await checkTryOnLimit(identifier, identifierType, userId || undefined)

    return NextResponse.json({
      images: result.images,
      seed: result.seed,
      remaining: updatedLimit.remaining,
      totalUsed: updatedLimit.totalUsed + 1,
    })

  } catch (error) {
    logError('Try-On API Error', error, { ip: getClientIp(request) })

    if (error instanceof Error) {
      return externalApiError(error.message)
    }

    return internalError('Failed to generate try-on')
  }
}
