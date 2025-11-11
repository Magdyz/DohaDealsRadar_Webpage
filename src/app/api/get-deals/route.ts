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
    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('is_archived', isArchived)
      .eq('is_approved', true)
      .gt('expires_at', new Date().toISOString())
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
    const transformedDeals = deals?.map((deal) => ({
      id: deal.id,
      title: deal.title,
      description: deal.description,
      imageUrl: deal.image_url,
      link: deal.link,
      location: deal.location,
      category: deal.category,
      promoCode: deal.promo_code,
      hotVotes: deal.hot_votes,
      coldVotes: deal.cold_votes,
      userId: deal.user_id,
      isApproved: deal.is_approved,
      isArchived: deal.is_archived,
      createdAt: deal.created_at,
      updatedAt: deal.updated_at,
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
