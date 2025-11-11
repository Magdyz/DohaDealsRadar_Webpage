// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

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

    const normalizedEmail = email.toLowerCase()

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
        { success: false, message: authError.message || 'Invalid verification code' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: 'Verification failed' },
        { status: 400 }
      )
    }

    console.log(`✅ OTP verified successfully for ${normalizedEmail}`)
    console.log(`👤 Supabase User ID: ${authData.user.id}`)

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
