// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      imageUrl,
      link,
      location,
      category,
      promoCode,
      expiryDays,
      userId,
    } = body

    // Validation
    if (!title || !imageUrl || !category || !expiryDays || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate expiry days
    const days = parseInt(expiryDays)
    if (isNaN(days) || days < 1 || days > 30) {
      return NextResponse.json(
        { success: false, message: 'Expiry days must be between 1 and 30' },
        { status: 400 }
      )
    }

    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    // Check if user exists and has auto-approve
    let autoApprove = false
    let postedBy = 'Anonymous'

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('auto_approve, username')
      .eq('id', userId)
      .single()

    if (!userError && userData) {
      autoApprove = userData.auto_approve || false
      postedBy = userData.username || 'Anonymous'
    }

    // Prepare deal data for insertion (matching actual database schema)
    const dealData = {
      title: title.trim(),
      description: description?.trim() || null,
      image_url: imageUrl,
      link: link?.trim() || null,
      location: location?.trim() || null,
      category,
      promo_code: promoCode?.trim() || null,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      is_approved: autoApprove,
      hot_votes: 0,
      cold_votes: 0,
      is_archived: false,
    }

    // Insert deal
    const { data: deal, error: insertError } = await supabase
      .from('deals')
      .insert([dealData])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting deal:', insertError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to submit deal',
          error: insertError.message,
        },
        { status: 500 }
      )
    }

    // Transform response to match API format (camelCase)
    const transformedDeal = {
      id: deal.id,
      title: deal.title,
      description: deal.description,
      imageUrl: deal.image_url,
      link: deal.link,
      location: deal.location,
      category: deal.category,
      promoCode: deal.promo_code,
      hotVotes: deal.hot_votes || 0,
      coldVotes: deal.cold_votes || 0,
      userId: deal.user_id,
      username: postedBy,
      isApproved: deal.is_approved || false,
      isArchived: deal.is_archived || false,
      createdAt: deal.created_at,
      updatedAt: deal.created_at,
      expiresAt: deal.expires_at,
    }

    return NextResponse.json({
      success: true,
      message: autoApprove
        ? 'Deal submitted and approved!'
        : 'Deal submitted for review',
      deal: transformedDeal,
      autoApproved: autoApprove,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
