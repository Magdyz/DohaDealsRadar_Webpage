// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isArchived = searchParams.get('isArchived') === 'true'

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    // Note: Database uses 'status' field for approval, not is_approved boolean
    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('status', 'approved') // Only show approved deals
      .eq('is_archived', isArchived) // Filter by archived status
      .gt('expires_at', new Date().toISOString()) // Only active deals
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: deals, error, count } = await query

    if (error) {
      console.error('Error fetching deals:', error)
      return NextResponse.json(
        { message: 'Failed to fetch deals', error: error.message },
        { status: 500 }
      )
    }

    // Transform database format to API format
    // Note: Mapping actual database column names to expected API format
    const transformedDeals = deals?.map((deal: any) => ({
      id: deal.id,
      title: deal.title,
      description: deal.description,
      imageUrl: deal.image_url,
      link: deal.link,
      location: deal.location,
      category: deal.category,
      promoCode: deal.promo_code,
      // Database uses hot_count/cold_count, not hot_votes/cold_votes
      hotVotes: deal.hot_count ?? deal.hot_votes ?? 0,
      coldVotes: deal.cold_count ?? deal.cold_votes ?? 0,
      // Database uses submitted_by_user_id, not user_id
      userId: deal.submitted_by_user_id ?? deal.user_id ?? '',
      username: deal.posted_by ?? null,
      // Database uses 'status' field instead of boolean is_approved
      isApproved: deal.status === 'approved' || deal.is_approved === true,
      isArchived: deal.is_archived ?? false,
      createdAt: deal.created_at,
      // Database doesn't have updated_at, use created_at as fallback
      updatedAt: deal.updated_at ?? deal.created_at,
      expiresAt: deal.expires_at,
    })) || []

    const total = count || 0
    const hasMore = offset + limit < total

    return NextResponse.json({
      deals: transformedDeals,
      total,
      page,
      limit,
      hasMore,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
