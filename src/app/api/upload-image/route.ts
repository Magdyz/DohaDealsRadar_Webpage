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

    // PERFORMANCE: Use multipart/form-data instead of base64 (3-4x faster, 33% less network overhead)
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file provided',
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB after compression from frontend)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Image size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Convert file to blob for Supabase upload
    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: file.type })

    // SECURITY: Generate secure filename (prevents path traversal)
    const uniqueFilename = generateSecureFilename(sanitizeFilename(file.name))
    const filePath = `images/${uniqueFilename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('deals')
      .upload(filePath, blob, {
        contentType: file.type,
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
