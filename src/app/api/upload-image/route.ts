import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { verifyAuthentication, AuthError } from '@/lib/auth/serverAuth'
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
} from '@/lib/utils/errorHandler'
import {
  validateImageFile,
  generateSecureFilename,
  sanitizeFilename,
} from '@/lib/validation/fileValidation'
import { checkRateLimit, imageUploadLimit } from '@/lib/utils/rateLimit'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication for image uploads
    const user = await verifyAuthentication(request)

    // SECURITY: Rate limiting to prevent storage abuse
    const rateLimitResult = checkRateLimit(
      request,
      imageUploadLimit,
      `upload:${user.id}`
    )
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: imageUploadLimit.message || 'Too many uploads',
          resetAt: rateLimitResult.resetAt,
        },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const validation = validateRequiredFields(body, ['image', 'filename'])
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${validation.missing?.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const { image, filename } = body

    // CRITICAL SECURITY: Validate file is actually an image
    const fileValidation = validateImageFile(image, filename)
    if (!fileValidation.valid) {
      return NextResponse.json(
        { success: false, message: fileValidation.error },
        { status: 400 }
      )
    }

    // Convert base64 to blob
    const base64Data = image.split(',')[1]
    const mimeType = fileValidation.mimeType!

    // Decode base64
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: mimeType })

    // SECURITY: Generate secure filename (prevents path traversal)
    const uniqueFilename = generateSecureFilename(sanitizeFilename(filename))
    const filePath = `images/${uniqueFilename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('deals')
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('deals')
      .getPublicUrl(filePath)

    return createSuccessResponse(
      {
        url: urlData.publicUrl,
        path: filePath,
      },
      'Image uploaded successfully'
    )
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    return createErrorResponse(error, 500, 'Upload Image API')
  }
}
