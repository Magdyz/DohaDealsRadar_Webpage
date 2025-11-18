// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { verifyModerator, AuthError } from '@/lib/auth/serverAuth'
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
} from '@/lib/utils/errorHandler'
import { sanitizeText } from '@/lib/utils/sanitize'

export async function POST(request: NextRequest) {
  try {
    // CRITICAL SECURITY FIX: Verify moderator from session, not request body
    const moderator = await verifyModerator(request)

    const body = await request.json()
    const { dealId, reason } = body

    // Validate required fields
    const validation = validateRequiredFields(body, ['dealId', 'reason'])
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${validation.missing?.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Sanitize rejection reason
    const sanitizedReason = sanitizeText(reason)
    if (!sanitizedReason) {
      return NextResponse.json(
        { success: false, message: 'Rejection reason cannot be empty' },
        { status: 400 }
      )
    }

    // Update deal status to rejected
    // @ts-ignore - Supabase type inference issue with custom schema
    const { data: deal, error: updateError } = await supabase
      .from('deals')
      .update({
        status: 'rejected',
        deleted_by: moderator.id, // Use verified moderator ID from session
        deleted_at: new Date().toISOString(),
        deletion_reason: sanitizedReason,
        requires_review: false,
      })
      .eq('id', dealId)
      .select()
      .single()

    if (updateError) {
      console.error('Error rejecting deal:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to reject deal' },
        { status: 500 }
      )
    }

    return createSuccessResponse({ deal }, 'Deal rejected successfully')
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    return createErrorResponse(error, 500, 'Reject Deal API')
  }
}
