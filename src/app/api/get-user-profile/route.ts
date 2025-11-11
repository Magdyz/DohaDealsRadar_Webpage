// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { success: false, message: 'Database error', error: error.message },
        { status: 500 }
      )
    }

    // Transform to camelCase
    const userProfile = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      autoApprove: user.auto_approve,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }

    return NextResponse.json({
      success: true,
      user: userProfile,
    })
  } catch (error: any) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
