// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeSearchQuery } from '@/lib/utils/sanitize'
import { createErrorResponse } from '@/lib/utils/errorHandler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// SECURITY FIX: Use anon key - let RLS policies enforce security
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isArchived = searchParams.get('isArchived') === 'true'

    // SECURITY: Sanitize search query to prevent SQL injection
    const sanitizedSearch = sanitizeSearchQuery(search)

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('is_archived', isArchived)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }) // Secondary sort for stable pagination

    // Apply filters with SANITIZED search query
    if (sanitizedSearch) {
      query = query.or(
        `title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`
      )
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
    const transformedDeals = (deals || []).map((deal: any) => {
      return {
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
        username: deal.posted_by || 'Anonymous',
        userId: deal.submitted_by_user_id,
        isApproved: deal.status === 'approved',
        isArchived: deal.is_archived,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
        expiresAt: deal.expires_at,
      }
    })

    const total = count || 0
    const hasMore = total > page * limit

    return NextResponse.json(
      {
        deals: transformedDeals,
        total,
        page,
        limit,
        hasMore,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    )
  } catch (error: any) {
    return createErrorResponse(error, 500, 'Get Deals API')
  }
}
