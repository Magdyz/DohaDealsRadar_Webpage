// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { dealId, moderatorUserId } = await request.json()

    if (!dealId || !moderatorUserId) {
      return NextResponse.json(
        { error: 'Deal ID and moderator user ID are required' },
        { status: 400 }
      )
    }

    // Verify moderator is admin
    const { data: moderator, error: modError } = await supabase
      .from('users')
      .select('role')
      .eq('id', moderatorUserId)
      .single<{ role: string }>()

    if (modError || !moderator) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (moderator.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can restore deals' },
        { status: 403 }
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
        { error: 'Failed to restore deal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Deal restored successfully',
    })
  } catch (error: any) {
    console.error('Error in restore-deal API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
