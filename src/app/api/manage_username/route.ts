// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, username } = body

    if (!userId || !username) {
      return NextResponse.json(
        { success: false, message: 'User ID and username are required' },
        { status: 400 }
      )
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens',
        },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Update user with username
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ username })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating username:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update username', error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Username registered successfully',
      username: updatedUser.username,
    })
  } catch (error: any) {
    console.error('Manage username error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
