/**
 * Error Handling Utilities
 *
 * Standardized error responses and logging for API routes and components.
 */

import { NextResponse } from 'next/server'

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AUTHENTICATION_ERROR'
  | 'PAYMENT_FAILED'
  | 'RESOURCE_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'INTERNAL_ERROR'

export type ApiErrorResponse = {
  error: string
  code?: ErrorCode
  details?: unknown
}

/**
 * Create a standardized API error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number,
  code?: ErrorCode,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error: message,
  }

  if (code) {
    response.code = code
  }

  if (details) {
    response.details = details
  }

  // Log error for debugging (in production, this should go to a logging service)
  if (statusCode >= 500) {
    console.error('[API Error]', {
      message,
      code,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Validation error (400)
 */
export function validationError(message: string, details?: unknown) {
  return createErrorResponse(message, 400, 'VALIDATION_ERROR', details)
}

/**
 * Rate limit exceeded error (429)
 */
export function rateLimitError(message: string = 'Rate limit exceeded') {
  return createErrorResponse(message, 429, 'RATE_LIMIT_EXCEEDED')
}

/**
 * Authentication error (401)
 */
export function authenticationError(message: string = 'Authentication required') {
  return createErrorResponse(message, 401, 'AUTHENTICATION_ERROR')
}

/**
 * Resource not found error (404)
 */
export function notFoundError(message: string = 'Resource not found') {
  return createErrorResponse(message, 404, 'RESOURCE_NOT_FOUND')
}

/**
 * Payment error (402)
 */
export function paymentError(message: string, details?: unknown) {
  return createErrorResponse(message, 402, 'PAYMENT_FAILED', details)
}

/**
 * Database error (500)
 */
export function databaseError(message: string = 'Database operation failed', details?: unknown) {
  return createErrorResponse(message, 500, 'DATABASE_ERROR', details)
}

/**
 * External API error (502)
 */
export function externalApiError(message: string, details?: unknown) {
  return createErrorResponse(message, 502, 'EXTERNAL_API_ERROR', details)
}

/**
 * Internal server error (500)
 */
export function internalError(message: string = 'Internal server error', details?: unknown) {
  return createErrorResponse(message, 500, 'INTERNAL_ERROR', details)
}

/**
 * Extract error message from unknown error type
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

/**
 * Log error with context (for debugging)
 */
export function logError(context: string, error: unknown, additionalInfo?: Record<string, unknown>) {
  console.error(`[${context}]`, {
    error: extractErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  })
}
