/**
 * Input sanitization utilities
 * Prevents XSS and injection attacks by sanitizing user input
 */

/**
 * Sanitizes string input by removing potentially dangerous characters
 * Strips HTML tags and dangerous characters while preserving basic text
 */
export function sanitizeString(input: string | null | undefined): string | null {
  if (!input) return null

  return (
    input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script-like content
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/**
 * Sanitizes text that may contain newlines (descriptions)
 */
export function sanitizeText(input: string | null | undefined): string | null {
  if (!input) return null

  return (
    input
      .trim()
      // Remove HTML tags but preserve newlines
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      // Remove script-like content
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes
      .replace(/\0/g, '')
      .trim()
  )
}

/**
 * Sanitizes URL input
 */
export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input) return null

  const trimmed = input.trim()

  // Only allow http and https protocols
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://')
  ) {
    return null
  }

  // Remove dangerous characters
  const sanitized = trimmed
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/[<>'"]/g, '')

  try {
    // Validate URL format
    new URL(sanitized)
    return sanitized
  } catch {
    return null
  }
}

/**
 * Sanitizes email input
 */
export function sanitizeEmail(input: string | null | undefined): string | null {
  if (!input) return null

  const trimmed = input.trim().toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return null
  }

  return trimmed
}

/**
 * Sanitizes numeric input
 */
export function sanitizeNumber(
  input: string | number | null | undefined
): number | null {
  if (input === null || input === undefined || input === '') return null

  const num = typeof input === 'string' ? parseFloat(input) : input

  if (isNaN(num) || !isFinite(num)) {
    return null
  }

  return num
}

/**
 * Sanitizes search query to prevent SQL injection
 */
export function sanitizeSearchQuery(
  query: string | null | undefined
): string | null {
  if (!query) return null

  return (
    query
      .trim()
      // Remove SQL special characters
      .replace(/[%;'"\\]/g, '')
      // Remove multiple wildcards
      .replace(/\*+/g, '*')
      // Limit length
      .substring(0, 100)
      .trim()
  )
}

/**
 * Validates and sanitizes category input
 */
export function sanitizeCategory(input: string | null | undefined): string {
  if (!input) return 'other'

  const validCategories = [
    'food_dining',
    'shopping_fashion',
    'entertainment',
    'home_services',
    'other',
  ]

  const sanitized = input.trim().toLowerCase()

  return validCategories.includes(sanitized) ? sanitized : 'other'
}

/**
 * Validates and sanitizes username
 */
export function sanitizeUsername(
  input: string | null | undefined
): string | null {
  if (!input) return null

  const trimmed = input.trim()

  // Username validation: 3-20 characters, alphanumeric, underscore, hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/

  if (!usernameRegex.test(trimmed)) {
    return null
  }

  // Prevent reserved usernames
  const reserved = ['admin', 'moderator', 'system', 'root', 'anonymous']
  if (reserved.includes(trimmed.toLowerCase())) {
    return null
  }

  return trimmed
}
