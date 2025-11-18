import imageCompression from 'browser-image-compression'

/**
 * Image compression utility inspired by the Android app's two-stage approach
 * Compresses images to optimize upload and display performance
 *
 * Targets:
 * - Max dimension: 1200px (reasonable for web display)
 * - Max file size: 500KB (good balance for quality/speed)
 * - Format: WebP when supported, JPEG fallback
 */

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  fileType?: string
}

/**
 * Compress an image file for upload
 * Similar to Android app's compression approach but adapted for web
 *
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImageForUpload(
  file: File,
  options?: CompressionOptions
): Promise<File> {
  const defaultOptions: CompressionOptions = {
    maxSizeMB: 0.5, // 500KB max file size
    maxWidthOrHeight: 1200, // Max dimension (good for web display)
    useWebWorker: true,
    fileType: 'image/webp', // WebP for better compression
  }

  const compressionOptions = { ...defaultOptions, ...options }

  try {
    console.log('📦 Starting image compression...')
    console.log(`   Original size: ${(file.size / 1024).toFixed(2)}KB`)
    console.log(`   Original type: ${file.type}`)

    const compressedFile = await imageCompression(file, compressionOptions)

    console.log(`✅ Compression complete!`)
    console.log(`   Compressed size: ${(compressedFile.size / 1024).toFixed(2)}KB`)
    console.log(`   Reduction: ${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`)

    return compressedFile
  } catch (error) {
    console.error('❌ Image compression failed:', error)
    // If compression fails, return original file as fallback
    console.warn('⚠️  Using original file as fallback')
    return file
  }
}

/**
 * Validate image file before upload
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' }
  }

  // Check file size (before compression)
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Image size must be less than ${maxSizeMB}MB`
    }
  }

  return { valid: true }
}

/**
 * Get image dimensions from a file
 * Useful for validation and aspect ratio calculations
 *
 * @param file - The image file
 * @returns Promise with image dimensions
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
