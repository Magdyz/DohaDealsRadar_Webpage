// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { verifyAuthentication, AuthError } from '@/lib/auth/serverAuth'
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
} from '@/lib/utils/errorHandler'
import { sanitizeUsername } from '@/lib/utils/sanitize'

export async function POST(request: NextRequest) {
  try {
    // CRITICAL SECURITY FIX: Verify user from session, not request body
    const user = await verifyAuthentication(request)

    const body = await request.json()
    const { username } = body

    // Validate required fields
    const validation = validateRequiredFields(body, ['username'])
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${validation.missing?.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate and sanitize username
    const sanitizedUsername = sanitizeUsername(username)
    if (!sanitizedUsername) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid username. Must be 3-20 characters and contain only letters, numbers, underscores, and hyphens. Reserved usernames (admin, moderator, system) are not allowed.',
        },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', sanitizedUsername)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Update user with username (use verified user ID from session)
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ username: sanitizedUsername })
      .eq('id', user.id) // Use verified user ID from session
      .select()
      .single()

    if (updateError) {
      console.error('Error updating username:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update username' },
        { status: 500 }
      )
    }

    return createSuccessResponse(
      { username: updatedUser.username },
      'Username registered successfully'
    )
  } catch (error: any) {
    // Handle authentication errors specifically
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    return createErrorResponse(error, 500, 'Manage Username API')
  }
}
