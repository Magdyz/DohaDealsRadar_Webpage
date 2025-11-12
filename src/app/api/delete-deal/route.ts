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
        { error: 'Only admins can delete deals' },
        { status: 403 }
      )
    }

    // Get the deal first to get the image URL
    const { data: deal, error: getDealError } = await supabase
      .from('deals')
      .select('image_url')
      .eq('id', dealId)
      .single()

    if (getDealError) {
      console.error('Error fetching deal:', getDealError)
      return NextResponse.json(
        { error: 'Failed to fetch deal' },
        { status: 500 }
      )
    }

    // Delete the deal from database
    const { error: deleteError } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId)

    if (deleteError) {
      console.error('Error deleting deal:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete deal' },
        { status: 500 }
      )
    }

    // Optionally delete the image from storage
    if (deal?.image_url) {
      try {
        // Extract the file path from the URL
        const url = new URL(deal.image_url)
        const pathMatch = url.pathname.match(/\/deals\/images\/(.+)$/)

        if (pathMatch && pathMatch[1]) {
          const filePath = `images/${pathMatch[1]}`
          await supabase.storage.from('deals').remove([filePath])
        }
      } catch (storageError) {
        // Log but don't fail the request if image deletion fails
        console.error('Error deleting image from storage:', storageError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Deal permanently deleted',
    })
  } catch (error: any) {
    console.error('Error in delete-deal API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
