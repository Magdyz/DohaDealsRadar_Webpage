// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { verifyModerator, AuthError } from '@/lib/auth/serverAuth'
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
} from '@/lib/utils/errorHandler'

export async function POST(request: NextRequest) {
  try {
    // CRITICAL SECURITY FIX: Verify moderator from session, not request body
    const moderator = await verifyModerator(request)

    const body = await request.json()
    const { dealId } = body

    // Validate required fields
    const validation = validateRequiredFields(body, ['dealId'])
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${validation.missing?.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Now we know this is a real moderator/admin (verified from session)

    // Update deal status to approved
    // @ts-ignore - Supabase type inference issue with custom schema
    const { data: deal, error: updateError } = await supabase
      .from('deals')
      .update({
        status: 'approved',
        approved_by: moderator.id, // Use verified moderator ID from session
        approved_at: new Date().toISOString(),
        requires_review: false,
      })
      .eq('id', dealId)
      .select()
      .single()

    if (updateError) {
      console.error('Error approving deal:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to approve deal' },
        { status: 500 }
      )
    }

    return createSuccessResponse({ deal }, 'Deal approved successfully')
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    return createErrorResponse(error, 500, 'Approve Deal API')
  }
}
