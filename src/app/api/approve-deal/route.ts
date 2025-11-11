// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { moderatorUserId, dealId } = body

    if (!moderatorUserId || !dealId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify moderator permissions
    const { data: moderator, error: modError } = await supabase
      .from('users')
      .select('role')
      .eq('id', moderatorUserId)
      .single<{ role: string }>()

    if (modError || !moderator) {
      return NextResponse.json(
        { success: false, message: 'Moderator not found' },
        { status: 404 }
      )
    }

    if (moderator.role !== 'moderator' && moderator.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Update deal status to approved
    // @ts-ignore - Supabase type inference issue with custom schema
    const { data: deal, error: updateError } = await supabase
      .from('deals')
      .update({
        status: 'approved',
        approved_by: moderatorUserId,
        approved_at: new Date().toISOString(),
        requires_review: false,
      })
      .eq('id', dealId)
      .select()
      .single()

    if (updateError) {
      console.error('Error approving deal:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to approve deal', error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Deal approved successfully',
      deal,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
