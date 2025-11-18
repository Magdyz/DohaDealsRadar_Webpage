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

    // Restore the deal (unarchive and set status to approved)
    const { error: updateError } = await supabase
      .from('deals')
      .update({
        is_archived: false,
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)

    if (updateError) {
      console.error('Error restoring deal:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to restore deal' },
        { status: 500 }
      )
    }

    return createSuccessResponse({}, 'Deal restored successfully')
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    return createErrorResponse(error, 500, 'Restore Deal API')
  }
}
