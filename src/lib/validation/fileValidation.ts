/**
 * File upload validation utilities
 * Validates file types, sizes, and content to prevent malicious uploads
 */

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

/**
 * File magic numbers (file signatures) for validation
 * These are the first bytes of valid image files
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  jpeg: [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  jpg: [
    [0xff, 0xd8, 0xff], // JPG (same as JPEG)
  ],
  png: [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  webp: [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
  ],
}

/**
 * Maximum file size (1MB after base64 decode)
 */
const MAX_FILE_SIZE = 1024 * 1024 // 1MB

export interface FileValidationResult {
  valid: boolean
  error?: string
  mimeType?: string
  size?: number
}

/**
 * Validates file extension
 */
export function validateFileExtension(filename: string): boolean {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  const ext = filename.toLowerCase().split('.').pop()

  return ext ? allowedExtensions.includes(`.${ext}`) : false
}

/**
 * Validates MIME type from base64 data URI
 */
export function validateMimeType(base64Data: string): {
  valid: boolean
  mimeType: string | null
} {
  try {
    // Extract MIME type from data URI
    const matches = base64Data.match(/^data:([^;]+);base64,/)

    if (!matches || !matches[1]) {
      return { valid: false, mimeType: null }
    }

    const mimeType = matches[1]

    // Check if MIME type is allowed
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { valid: false, mimeType }
    }

    return { valid: true, mimeType }
  } catch {
    return { valid: false, mimeType: null }
  }
}

/**
 * Validates file magic number (file signature)
 */
export function validateFileSignature(
  bytes: Buffer,
  extension: string
): boolean {
  const ext = extension.toLowerCase().replace('.', '')
  const signatures = FILE_SIGNATURES[ext]

  if (!signatures) {
    return false
  }

  // Check if file starts with any of the valid signatures
  return signatures.some((signature) =>
    signature.every((byte, index) => bytes[index] === byte)
  )
}

/**
 * Validates file size
 */
export function validateFileSize(bytes: Buffer): boolean {
  return bytes.length <= MAX_FILE_SIZE
}

/**
 * Comprehensive file validation
 */
export function validateImageFile(
  base64Data: string,
  filename: string
): FileValidationResult {
  // 1. Validate file extension
  if (!validateFileExtension(filename)) {
    return {
      valid: false,
      error: 'Invalid file extension. Only JPG, PNG, and WebP are allowed.',
    }
  }

  // 2. Validate MIME type
  const mimeValidation = validateMimeType(base64Data)
  if (!mimeValidation.valid) {
    return {
      valid: false,
      error: 'Invalid file type. Only images are allowed.',
    }
  }

  try {
    // 3. Decode base64 to bytes
    const base64Content = base64Data.split(',')[1]
    if (!base64Content) {
      return {
        valid: false,
        error: 'Invalid base64 data.',
      }
    }

    const bytes = Buffer.from(base64Content, 'base64')

    // 4. Validate file size
    if (!validateFileSize(bytes)) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      }
    }

    // 5. Validate file signature (magic number)
    const extension = filename.split('.').pop() || ''
    if (!validateFileSignature(bytes, extension)) {
      return {
        valid: false,
        error: 'File content does not match file extension. File may be corrupted or invalid.',
      }
    }

    // All validations passed
    return {
      valid: true,
      mimeType: mimeValidation.mimeType || undefined,
      size: bytes.length,
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate file. File may be corrupted.',
    }
  }
}

/**
 * Sanitizes filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return (
    filename
      // Remove path separators
      .replace(/[\/\\]/g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove special characters
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      // Limit length
      .substring(0, 255)
  )
}

/**
 * Generates a secure random filename
 */
export function generateSecureFilename(originalFilename: string): string {
  const extension = originalFilename.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)

  return `${timestamp}-${random}.${extension}`
}
