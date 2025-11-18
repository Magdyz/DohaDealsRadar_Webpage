import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createErrorResponse } from '@/lib/utils/errorHandler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dealId = searchParams.get('dealId')

    if (!dealId) {
      return NextResponse.json({ message: 'Deal ID is required' }, { status: 400 })
    }

    // SECURITY FIX: Use service role key to fetch deal, then verify access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: deal, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()

    if (error) {
      throw error
    }

    if (!deal) {
      return NextResponse.json({ message: 'Deal not found' }, { status: 404 })
    }

    // SECURITY CHECK: Verify access permissions for non-public deals
    const isPublicDeal = deal.status === 'approved' && !deal.is_archived

    if (!isPublicDeal) {
      // Deal is pending, rejected, or archived - requires authentication
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')

      let isAuthorized = false

      if (token) {
        // Verify user from JWT token (auth.users)
        const authSupabase = createClient(supabaseUrl, supabaseAnonKey)
        const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser(token)

        if (!authError && authUser && authUser.email) {
          // EMAIL-BASED LOOKUP: Map auth user email → database user
          // This allows web app (JWT) and Android app (database ID) to coexist
          const { data: userData, error: userLookupError } = await supabase
            .from('users')
            .select('role, id')
            .eq('email', authUser.email) // Look up by EMAIL not ID
            .maybeSingle()

          if (userData) {
            // Allow if user is moderator, admin, or deal owner
            isAuthorized =
              userData.role === 'moderator' ||
              userData.role === 'admin' ||
              userData.id === deal.submitted_by_user_id
          }
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { message: 'You do not have permission to view this deal' },
          { status: 403 }
        )
      }
    }

    // Transform database fields to match frontend types (snake_case to camelCase)
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
      username: deal.posted_by || 'Anonymous',
      userId: deal.submitted_by_user_id,
      isApproved: deal.status === 'approved',
      isArchived: deal.is_archived,
      createdAt: deal.created_at,
      updatedAt: deal.updated_at,
      expiresAt: deal.expires_at,
    }

    return NextResponse.json(
      { deal: transformedDeal },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error: any) {
    return createErrorResponse(error, 500, 'Get Deal API')
  }
}
