// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAuthentication, AuthError } from '@/lib/auth/serverAuth'
import {
  createErrorResponse,
  validateRequiredFields,
} from '@/lib/utils/errorHandler'
import {
  sanitizeString,
  sanitizeText,
  sanitizeUrl,
  sanitizeNumber,
  sanitizeCategory,
} from '@/lib/utils/sanitize'
import { checkRateLimit, dealSubmitLimit } from '@/lib/utils/rateLimit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// SECURITY FIX: Use anon key by default, service key only for admin checks
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // CRITICAL SECURITY FIX: Verify user from session, not request body
    const user = await verifyAuthentication(request)

    // SECURITY: Rate limiting to prevent spam
    const rateLimitResult = checkRateLimit(
      request,
      dealSubmitLimit,
      `submit:${user.id}`
    )
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: dealSubmitLimit.message || 'Too many deal submissions',
          resetAt: rateLimitResult.resetAt,
        },
        { status: 429 }
      )
    }

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
    } = body

    // Validate required fields
    const requiredFields = ['title', 'imageUrl', 'category', 'expiryDays']
    const validation = validateRequiredFields(body, requiredFields)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${validation.missing?.join(', ')}`,
        },
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

    // CRITICAL SECURITY: Sanitize all user inputs
    const sanitizedTitle = sanitizeString(title)
    const sanitizedDescription = sanitizeText(description)
    const sanitizedImageUrl = sanitizeUrl(imageUrl)
    const sanitizedLink = sanitizeUrl(link)
    const sanitizedLocation = sanitizeString(location)
    const sanitizedPromoCode = sanitizeString(promoCode)
    const finalCategory = sanitizeCategory(category)

    // Validate sanitized inputs
    if (!sanitizedTitle) {
      return NextResponse.json(
        { success: false, message: 'Invalid title' },
        { status: 400 }
      )
    }

    if (!sanitizedImageUrl) {
      return NextResponse.json(
        { success: false, message: 'Invalid image URL' },
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

    console.log(`Category validation: received='${category}', using='${finalCategory}'`)

    // CRITICAL FIX: Extract user's JWT token from Authorization header
    const authHeader = request.headers.get('authorization')
    const userToken = authHeader?.replace('Bearer ', '')

    if (!userToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication token missing' },
        { status: 401 }
      )
    }

    // Create Supabase client with user's JWT token (RLS policies will be enforced with auth context)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    })

    // AUTO-APPROVAL LOGIC (using verified user from session)
    let dealStatus = 'pending'
    let autoApproved = false
    let requiresReview = true
    const postedBy = user.username || 'Anonymous'
    const userRole = user.role
    const userAutoApprove = user.autoApprove

    console.log(
      `User: ${postedBy} | Role: ${userRole} | Auto-approve: ${userAutoApprove}`
    )

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

    // Prepare deal data for insertion with SANITIZED inputs
    const dealData: any = {
      title: sanitizedTitle,
      description: sanitizedDescription,
      image_url: sanitizedImageUrl,
      link: sanitizedLink,
      location: sanitizedLocation,
      category: finalCategory,
      promo_code: sanitizedPromoCode,
      original_price: sanitizeNumber(originalPrice),
      discounted_price: sanitizeNumber(discountedPrice),
      submitted_by_user_id: user.id, // Use verified user ID from session
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
      dealData.approved_by = user.id // Use verified user ID
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
    // Handle authentication errors specifically
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      )
    }

    return createErrorResponse(error, 500, 'Submit Deal API')
  }
}
