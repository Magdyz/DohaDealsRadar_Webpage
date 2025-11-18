// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { checkRateLimit, loginRateLimit } from '@/lib/utils/rateLimit'
import {
  createErrorResponse,
  validateRequiredFields,
} from '@/lib/utils/errorHandler'
import { sanitizeEmail } from '@/lib/utils/sanitize'

export async function POST(request: NextRequest) {
  try {
    // CRITICAL SECURITY: Rate limiting to prevent OTP spam
    const rateLimitResult = checkRateLimit(request, loginRateLimit)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            loginRateLimit.message ||
            'Too many requests. Please try again in 15 minutes.',
          resetAt: rateLimitResult.resetAt,
        },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const validation = validateRequiredFields(body, ['email'])
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${validation.missing?.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const { email } = body

    // SECURITY: Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(email)
    if (!sanitizedEmail) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log(`📧 Sending OTP to ${sanitizedEmail} via Supabase Auth...`)

    // Use Supabase Auth to send OTP (One-Time Password)
    const { data, error } = await supabase.auth.signInWithOtp({
      email: sanitizedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined, // We handle verification in-app
      },
    })

    if (error) {
      console.error('❌ Supabase Auth error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    console.log(`✅ OTP sent successfully via Supabase to ${sanitizedEmail}`)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
    })
  } catch (error: any) {
    return createErrorResponse(error, 500, 'Send Verification Code API')
  }
}

