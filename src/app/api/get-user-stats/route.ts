import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const stats = {
      totalDeals: user.submitted_deals_count || 0,
      approvedDeals: user.approved_deals_count || 0,
      rejectedDeals: user.rejected_deals_count || 0,
      memberSince: user.created_at,
    }

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error('Get user stats API error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
