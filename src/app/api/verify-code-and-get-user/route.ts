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
    // Rate limiting: Prevent OTP verification spam
    const rateLimitResult = checkRateLimit(request, loginRateLimit)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: loginRateLimit.message || 'Too many attempts',
          resetAt: rateLimitResult.resetAt,
        },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const validation = validateRequiredFields(body, ['email', 'code', 'deviceId'])
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${validation.missing?.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const { email, code, deviceId } = body

    // Sanitize email input
    const normalizedEmail = sanitizeEmail(email)
    if (!normalizedEmail) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log(`🔐 Verifying OTP for ${normalizedEmail}...`)

    // Verify OTP using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type: 'email',
    })

    if (authError) {
      console.error('❌ Supabase Auth verification error:', authError)
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { success: false, message: 'Verification failed' },
        { status: 400 }
      )
    }

    console.log(`✅ OTP verified successfully for ${normalizedEmail}`)
    console.log(`👤 Supabase User ID: ${authData.user.id}`)

    // Extract session token for client to use in subsequent requests
    const accessToken = authData.session.access_token
    const refreshToken = authData.session.refresh_token

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is ok
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    if (existingUser) {
      // User exists - update last login and device_id
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          device_id: deviceId,
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user:', updateError)
      }

      // Transform to camelCase
      const user = {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        role: existingUser.role,
        autoApprove: existingUser.auto_approve,
        createdAt: existingUser.created_at,
        updatedAt: existingUser.updated_at,
      }

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user,
        isNewUser: false,
        session: {
          accessToken,
          refreshToken,
        },
      })
    } else {
      // New user - create account
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            email: normalizedEmail,
            device_id: deviceId,
            email_verified: true,
            role: 'user',
            auto_approve: false,
            last_login_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { success: false, message: 'Failed to create user account' },
          { status: 500 }
        )
      }

      // Transform to camelCase
      const user = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        autoApprove: newUser.auto_approve,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at,
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user,
        isNewUser: true,
        session: {
          accessToken,
          refreshToken,
        },
      })
    }
  } catch (error: any) {
    console.error('Verify code error:', error)
    return createErrorResponse(error, 500, 'Verify Code API')
  }
}
