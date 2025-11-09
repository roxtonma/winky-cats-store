import { QikinkOrderRequest, QikinkOrderResponse } from '@/types/qikink'

export class QikinkAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'QikinkAPIError'
  }
}

interface TokenResponse {
  ClientId: string
  Accesstoken: string
  expires_in: number
}

export class QikinkClient {
  private baseUrl: string
  private clientId: string
  private clientSecret: string
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor() {
    this.baseUrl = process.env.QIKINK_API_URL || 'https://sandbox.qikink.com'
    this.clientId = process.env.QIKINK_CLIENT_ID || ''
    this.clientSecret = process.env.QIKINK_CLIENT_SECRET || ''

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Qikink credentials not configured. Please set QIKINK_CLIENT_ID and QIKINK_CLIENT_SECRET in environment variables.')
    }
  }

  /**
   * Generate a new access token from Qikink
   */
  private async generateToken(): Promise<void> {
    const url = `${this.baseUrl}/api/token`

    // Create URL-encoded body
    const body = new URLSearchParams({
      ClientId: this.clientId,
      client_secret: this.clientSecret,
    })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new QikinkAPIError(
          `Token generation failed: ${errorText}`,
          response.status
        )
      }

      const data: TokenResponse = await response.json()

      // Store the token and calculate expiration
      this.accessToken = data.Accesstoken
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute before expiry

      console.log('Qikink access token generated successfully')
    } catch (error) {
      if (error instanceof QikinkAPIError) {
        throw error
      }
      throw new QikinkAPIError(
        `Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    // Check if token is missing or expired
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      await this.generateToken()
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure we have a valid access token before making the request
    await this.ensureValidToken()

    const url = `${this.baseUrl}${endpoint}`

    // Log the request details for debugging
    const requestBody = options.body ? JSON.parse(options.body as string) : undefined
    console.log('Qikink API Request:', {
      url,
      method: options.method || 'GET',
      body: requestBody
    })

    // Log line items in detail if present
    if (requestBody && requestBody.line_items) {
      console.log('Line Items Detail:', JSON.stringify(requestBody.line_items, null, 2))
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'ClientId': this.clientId,
        'Accesstoken': this.accessToken!,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    // Get response as text first to see raw response
    const responseText = await response.text()
    console.log('Qikink API Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    })

    let data: unknown
    try {
      data = JSON.parse(responseText)
    } catch {
      throw new QikinkAPIError(
        `Invalid JSON response from Qikink API: ${responseText}`,
        response.status
      )
    }

    if (!response.ok) {
      const errorData = data as { message?: string; errors?: unknown }
      console.error('Qikink API Error Details:', {
        status: response.status,
        message: errorData.message,
        errors: errorData.errors,
        fullResponse: data
      })

      // Type guard to safely narrow the type
      const errors =
        errorData.errors &&
        typeof errorData.errors === 'object' &&
        !Array.isArray(errorData.errors)
          ? (errorData.errors as Record<string, string[]>)
          : undefined

      throw new QikinkAPIError(
        errorData.message || 'Qikink API request failed',
        response.status,
        errors
      )
    }

    return data as T
  }

  async createOrder(orderData: QikinkOrderRequest): Promise<QikinkOrderResponse> {
    try {
      const response = await this.makeRequest<QikinkOrderResponse>(
        '/api/order/create',
        {
          method: 'POST',
          body: JSON.stringify(orderData),
        }
      )

      return response
    } catch (error) {
      if (error instanceof QikinkAPIError) {
        throw error
      }
      throw new QikinkAPIError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
    }
  }

  async createOrderWithRetry(
    orderData: QikinkOrderRequest,
    maxRetries = 3,
    retryDelay = 2000
  ): Promise<QikinkOrderResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.createOrder(orderData)
      } catch (error) {
        lastError = error as Error

        // Don't retry on client errors (4xx)
        if (error instanceof QikinkAPIError && error.statusCode && error.statusCode < 500) {
          throw error
        }

        if (attempt < maxRetries) {
          console.log(`Qikink API attempt ${attempt} failed, retrying in ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          retryDelay *= 2 // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Failed to create order after retries')
  }
}

// Export a singleton instance
export const qikinkClient = new QikinkClient()
