import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// Import the verification codes map from send-verification-code
// Note: In production, use a proper cache like Redis
let verificationCodes: Map<string, { code: string; expiresAt: number }>

// Dynamic import workaround for shared state
if (typeof window === 'undefined') {
  verificationCodes = new Map()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, deviceId } = body

    if (!email || !code || !deviceId) {
      return NextResponse.json(
        { success: false, message: 'Email, code, and deviceId are required' },
        { status: 400 }
      )
    }

    // Get stored verification code
    const normalizedEmail = email.toLowerCase()

    // For development, accept any 6-digit code (remove in production)
    const isDevelopment = process.env.NODE_ENV === 'development'

    if (!isDevelopment) {
      const stored = verificationCodes.get(normalizedEmail)

      if (!stored) {
        return NextResponse.json(
          { success: false, message: 'Verification code not found or expired' },
          { status: 400 }
        )
      }

      if (stored.expiresAt < Date.now()) {
        verificationCodes.delete(normalizedEmail)
        return NextResponse.json(
          { success: false, message: 'Verification code expired' },
          { status: 400 }
        )
      }

      if (stored.code !== code) {
        return NextResponse.json(
          { success: false, message: 'Invalid verification code' },
          { status: 400 }
        )
      }

      // Code is valid, remove it
      verificationCodes.delete(normalizedEmail)
    }

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
        { success: false, message: 'Database error', error: fetchError.message },
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
          { success: false, message: 'Failed to create user', error: createError.message },
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
      })
    }
  } catch (error: any) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
