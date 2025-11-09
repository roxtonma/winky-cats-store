import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { checkTryOnLimit, recordTryOnAttempt, getClientIp } from '@/lib/rateLimiter'
import { rateLimitError, validationError, externalApiError, internalError, logError } from '@/lib/errors'

fal.config({
  credentials: process.env.FAL_KEY
})

type FalAIResult = {
  images: Array<{ url: string }>
  seed: number
}

type ProductItem = {
  id: string
  name: string
  images: string[]
  slot: string
  source: 'store' | 'affiliate'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const userId = formData.get('userId') as string | null
    const clientIp = getClientIp(request)

    let identifierType: 'ip' | 'user' = 'ip'
    let identifier = clientIp

    if (userId) {
      identifierType = 'user'
      identifier = userId
    }

    const limitCheck = await checkTryOnLimit(identifier, identifierType, userId || undefined)

    if (!limitCheck.allowed) {
      logError('Multi-Item Try-On Rate Limit', `${identifierType} ${identifier} exceeded try-on limit`, {
        remaining: limitCheck.remaining,
        totalUsed: limitCheck.totalUsed,
      })
      return rateLimitError(
        limitCheck.message || 'Try-on limit reached. Please try again later.'
      )
    }

    const file = formData.get('file') as File
    const itemsStr = formData.get('items') as string

    if (!file) {
      return validationError('User image is required')
    }

    if (!itemsStr) {
      return validationError('Items are required')
    }

    const items: ProductItem[] = JSON.parse(itemsStr)

    if (items.length === 0) {
      return validationError('At least one item must be selected')
    }

    // Upload user image to Fal storage
    const uploadedImageUrl = await fal.storage.upload(file)
    console.log('Uploaded user image to Fal:', uploadedImageUrl)

    // Extract front images from all products
    const productImages: string[] = items.map(item => {
      const frontImage = item.images.find((img: string) =>
        img.toLowerCase().includes('front') ||
        (!img.toLowerCase().includes('back') && !img.toLowerCase().includes('size_chart'))
      ) || item.images[0]
      return frontImage
    })

    // Build multi-item prompt
    const itemDescriptions = items.map(item => {
      const slotLabel = item.slot.replace('-', ' ')
      return `${item.name} (${slotLabel})`
    }).join(', ')

    const prompt = `Make the person wear these clothing items: ${itemDescriptions}. Show all items fitting naturally together on the person. Maintain realistic proportions and lighting. Keep the person's pose and expression natural.`

    console.log('Starting multi-item try-on with prompt:', prompt)
    console.log('Number of items:', items.length)

    // Prepare image URLs: user image + all product images
    const imageUrls = [uploadedImageUrl, ...productImages]

    console.log('Image URLs count:', imageUrls.length)

    // Call Fal AI SeeDream Edit API
    const result = await fal.subscribe('fal-ai/bytedance/seedream/v4/edit', {
      input: {
        prompt: prompt,
        image_size: {
          height: 2160,
          width: 3840
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

    // Record the attempt (count as 1 attempt regardless of number of items)
    const productIds = items
      .filter(item => item.source === 'store')
      .map(item => item.id)

    if (productIds.length > 0) {
      await recordTryOnAttempt(identifier, identifierType, productIds[0], userId || undefined)
    } else {
      await recordTryOnAttempt(identifier, identifierType, undefined, userId || undefined)
    }

    const updatedLimit = await checkTryOnLimit(identifier, identifierType, userId || undefined)

    return NextResponse.json({
      images: result.images,
      seed: result.seed,
      remaining: updatedLimit.remaining,
      totalUsed: updatedLimit.totalUsed + 1,
    })

  } catch (error) {
    logError('Multi-Item Try-On API Error', error, { ip: getClientIp(request) })

    if (error instanceof Error) {
      return externalApiError(error.message)
    }

    return internalError('Failed to generate multi-item try-on')
  }
}
