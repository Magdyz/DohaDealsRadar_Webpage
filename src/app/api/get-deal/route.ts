import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dealId = searchParams.get('dealId')

    if (!dealId) {
      return NextResponse.json({ message: 'Deal ID is required' }, { status: 400 })
    }

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
    console.error('Get deal API error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch deal' },
      { status: 500 }
    )
  }
}
