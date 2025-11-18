/**
 * Error handling and sanitization utilities
 * Prevents information disclosure while maintaining useful error logging
 */

import { NextResponse } from 'next/server'

/**
 * Sanitizes error messages for client responses
 * In production, returns generic messages
 * In development, returns detailed messages for debugging
 */
export function sanitizeError(error: unknown): string {
  // In development, return detailed error messages
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }

  // In production, return generic messages only
  if (error instanceof Error) {
    // Allow specific error messages that are safe to expose
    if (
      error.message.includes('not found') ||
      error.message.includes('Missing') ||
      error.message.includes('Invalid') ||
      error.message.includes('required') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('Forbidden') ||
      error.message.includes('permissions')
    ) {
      return error.message
    }
  }

  // Default generic message
  return 'An error occurred. Please try again later.'
}

/**
 * Logs error details server-side while returning sanitized message to client
 */
export function logAndSanitizeError(
  error: unknown,
  context: string
): { message: string; logged: boolean } {
  // Log full error details server-side
  console.error(`[${context}]`, error)

  // Return sanitized message for client
  return {
    message: sanitizeError(error),
    logged: true,
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  context: string = 'API Error'
): NextResponse {
  const { message } = logAndSanitizeError(error, context)

  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: statusCode }
  )
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  data: any,
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    message: message || 'Operation successful',
    ...data,
  })
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing?: string[] } {
  const missing = requiredFields.filter((field) => !body[field])

  if (missing.length > 0) {
    return { valid: false, missing }
  }

  return { valid: true }
}

/**
 * Common error types for consistent error handling
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Maps error types to HTTP status codes
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof ValidationError) return 400
  if (error instanceof UnauthorizedError) return 401
  if (error instanceof ForbiddenError) return 403
  if (error instanceof NotFoundError) return 404

  // Check for error name (for errors from other modules)
  if (error instanceof Error) {
    if (error.name === 'ValidationError') return 400
    if (error.name === 'AuthError') return 401
    if (error.name === 'NotFoundError') return 404
  }

  return 500
}
