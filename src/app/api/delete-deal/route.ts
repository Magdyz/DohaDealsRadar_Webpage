// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { verifyAdmin, AuthError } from '@/lib/auth/serverAuth'
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
} from '@/lib/utils/errorHandler'

export async function POST(request: NextRequest) {
  try {
    // CRITICAL SECURITY FIX: Verify admin from session, not request body
    const admin = await verifyAdmin(request)

    const { dealId } = await request.json()

    // Validate required fields
    const validation = validateRequiredFields({ dealId }, ['dealId'])
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${validation.missing?.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Get the deal first to get the image URL
    const { data: deal, error: getDealError } = await supabase
      .from('deals')
      .select('image_url')
      .eq('id', dealId)
      .single()

    if (getDealError) {
      console.error('Error fetching deal:', getDealError)
      return NextResponse.json(
        { success: false, message: 'Deal not found' },
        { status: 404 }
      )
    }

    // Delete the deal from database
    const { error: deleteError } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId)

    if (deleteError) {
      console.error('Error deleting deal:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete deal' },
        { status: 500 }
      )
    }

    // Optionally delete the image from storage
    if (deal?.image_url) {
      try {
        // SECURITY FIX: Safer path extraction to prevent path traversal
        const url = new URL(deal.image_url)
        const pathParts = url.pathname.split('/')
        const filename = pathParts[pathParts.length - 1]

        // Validate filename (no path traversal characters)
        if (filename && !filename.includes('..') && !filename.includes('/')) {
          const filePath = `images/${filename}`
          await supabase.storage.from('deals').remove([filePath])
        }
      } catch (storageError) {
        // Log but don't fail the request if image deletion fails
        console.error('Error deleting image from storage:', storageError)
      }
    }

    return createSuccessResponse({}, 'Deal permanently deleted')
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    return createErrorResponse(error, 500, 'Delete Deal API')
  }
}
