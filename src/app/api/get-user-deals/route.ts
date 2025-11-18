import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createErrorResponse } from '@/lib/utils/errorHandler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    // SECURITY CHECK: Verify authentication for accessing user deals
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    let isAuthorized = false

    if (token) {
      // Verify user from JWT token
      const authSupabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { user }, error: authError } = await authSupabase.auth.getUser(token)

      if (!authError && user) {
        // Use service role key to get user role
        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data: userData } = await serviceSupabase
          .from('users')
          .select('role, id')
          .eq('id', user.id)
          .single()

        if (userData) {
          // Allow if user is viewing their own deals or is moderator/admin
          isAuthorized =
            userData.id === userId ||
            userData.role === 'moderator' ||
            userData.role === 'admin'
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { message: 'You do not have permission to view these deals' },
        { status: 403 }
      )
    }

    // SECURITY FIX: Use service role key to fetch all deal statuses (pending, approved, rejected, archived)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: deals, error, count } = await supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('submitted_by_user_id', userId)
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
    return createErrorResponse(error, 500, 'Get User Deals API')
  }
}
