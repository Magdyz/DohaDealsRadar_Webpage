import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: deals, error, count } = await supabase
      .from('deals')
      .select(`
        *,
        users!user_id (username)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    // Transform database fields to match frontend types (snake_case to camelCase)
    const transformedDeals = (deals || []).map((deal: any) => ({
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
      username: deal.users?.username || null,
      userId: deal.user_id,
      isApproved: deal.is_approved,
      isArchived: deal.is_archived,
      createdAt: deal.created_at,
      updatedAt: deal.updated_at,
      expiresAt: deal.expires_at,
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
    console.error('Get user deals API error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch user deals' },
      { status: 500 }
    )
  }
}
