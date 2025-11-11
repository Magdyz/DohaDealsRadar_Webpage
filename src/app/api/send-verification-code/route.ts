// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log(`📧 Sending OTP to ${email} via Supabase Auth...`)

    // Use Supabase Auth to send OTP (One-Time Password)
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined, // We handle verification in-app
      },
    })

    if (error) {
      console.error('❌ Supabase Auth error:', error)
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to send verification code' },
        { status: 500 }
      )
    }

    console.log(`✅ OTP sent successfully via Supabase to ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
    })
  } catch (error: any) {
    console.error('Send verification code error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

