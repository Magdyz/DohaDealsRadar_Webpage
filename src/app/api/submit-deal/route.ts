// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
      originalPrice,
      discountedPrice,
      expiryDays,
      userId,
    } = body

    // Validation - Required fields
    if (!title || !imageUrl || !category || !expiryDays || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validation - Must have either link OR location
    if (!link && !location) {
      return NextResponse.json(
        { success: false, message: 'Must provide either link or location' },
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

    // Validate category (matching Edge Function)
    const validCategories = [
      'food_dining',
      'shopping_fashion',
      'entertainment',
      'home_services',
      'other'
    ]
    const finalCategory = validCategories.includes(category) ? category : 'other'

    console.log(`Category validation: received='${category}', using='${finalCategory}'`)

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // AUTO-APPROVAL LOGIC (matching Edge Function)
    let dealStatus = 'pending'
    let autoApproved = false
    let requiresReview = true
    let postedBy = 'Anonymous'
    let userRole = 'user'
    let userAutoApprove = false

    // Check if user exists and get role and auto_approve
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, auto_approve, username')
      .eq('id', userId)
      .single()

    if (!userError && userData) {
      userRole = userData.role
      userAutoApprove = userData.auto_approve
      postedBy = userData.username || 'Anonymous'

      console.log(`User: ${postedBy} | Role: ${userRole} | Auto-approve: ${userAutoApprove}`)

      // RULE 1: ADMINS ALWAYS AUTO-APPROVE
      if (userRole === 'admin') {
        dealStatus = 'approved'
        autoApproved = true
        requiresReview = false
        console.log('ADMIN: Deal auto-approved')
      } else if (userRole === 'moderator') {
        dealStatus = 'approved'
        autoApproved = true
        requiresReview = false
        console.log('MODERATOR: Deal auto-approved')
      } else if (userAutoApprove === true) {
        const randomReviewChance = Math.random()
        if (randomReviewChance < 0.15) {
          // 15% chance: Send to review even for trusted users
          dealStatus = 'pending'
          autoApproved = false
          requiresReview = true
          console.log('TRUSTED USER: Random review triggered (15% chance)')
        } else {
          // 85% chance: Auto-approve
          dealStatus = 'approved'
          autoApproved = true
          requiresReview = false
          console.log('TRUSTED USER: Deal auto-approved')
        }
      } else {
        dealStatus = 'pending'
        autoApproved = false
        requiresReview = true
        console.log('NEW USER: Deal requires review')
      }
    } else {
      console.warn('User not found, defaulting to pending')
    }

    // Prepare deal data for insertion (matching actual database schema)
    const dealData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      image_url: imageUrl,
      link: link?.trim() || null,
      location: location?.trim() || null,
      category: finalCategory,
      promo_code: promoCode?.trim() || null,
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      discounted_price: discountedPrice ? parseFloat(discountedPrice) : null,
      submitted_by_user_id: userId,
      posted_by: postedBy,
      expires_at: expiresAt.toISOString(),
      status: dealStatus,
      requires_review: requiresReview,
      hot_count: 0,
      cold_count: 0,
      is_archived: false,
    }

    // If auto-approved, set approved_at timestamp
    if (autoApproved) {
      dealData.approved_at = new Date().toISOString()
      dealData.approved_by = userId
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
      originalPrice: deal.original_price ? String(deal.original_price) : null,
      discountedPrice: deal.discounted_price ? String(deal.discounted_price) : null,
      hotVotes: deal.hot_count || 0,
      coldVotes: deal.cold_count || 0,
      userId: deal.submitted_by_user_id,
      username: deal.posted_by || postedBy,
      isApproved: deal.status === 'approved',
      isArchived: deal.is_archived || false,
      createdAt: deal.created_at,
      updatedAt: deal.updated_at || deal.created_at,
      expiresAt: deal.expires_at,
    }

    console.log(`Deal submitted: "${deal.title}" | Status: ${dealStatus} | Category: ${finalCategory}`)

    return NextResponse.json({
      success: true,
      message: autoApproved
        ? 'Deal submitted and approved!'
        : 'Deal submitted for review',
      deal: transformedDeal,
      autoApproved: autoApproved,
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
