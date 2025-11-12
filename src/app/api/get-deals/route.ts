// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isArchived = searchParams.get('isArchived') === 'true'

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('is_archived', isArchived)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }) // Secondary sort for stable pagination

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    // Only show approved deals for non-archived queries
    if (!isArchived) {
      query = query.eq('status', 'approved')
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: deals, error, count } = await query

    if (error) {
      throw error
    }

    // Transform database fields to match frontend types (snake_case to camelCase)
    const transformedDeals = await Promise.all((deals || []).map(async (deal: any) => {
      // Get username from users table
      let username = null
      if (deal.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', deal.user_id)
          .single()
        username = userData?.username || null
      }

      return {
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
        username: username,
        userId: deal.user_id,
        isApproved: deal.is_approved,
        isArchived: deal.is_archived,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
        expiresAt: deal.expires_at,
      }
    }))

    const total = count || 0
    const hasMore = total > page * limit

    return NextResponse.json({
      deals: transformedDeals,
      total,
      page,
      limit,
      hasMore,
    })
  } catch (error: any) {
    console.error('Get deals API error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}
