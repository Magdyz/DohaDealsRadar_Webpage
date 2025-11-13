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

    // Get user data to verify user exists
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

    // Get accurate counts by querying the deals table directly
    // Total deals count
    const { count: totalDeals, error: totalError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by_user_id', userId)

    if (totalError) {
      throw totalError
    }

    // Approved deals count
    const { count: approvedDeals, error: approvedError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by_user_id', userId)
      .eq('status', 'approved')

    if (approvedError) {
      throw approvedError
    }

    // Pending deals count
    const { count: pendingDeals, error: pendingError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by_user_id', userId)
      .eq('status', 'pending')

    if (pendingError) {
      throw pendingError
    }

    // Rejected deals count
    const { count: rejectedDeals, error: rejectedError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by_user_id', userId)
      .eq('status', 'rejected')

    if (rejectedError) {
      throw rejectedError
    }

    const stats = {
      total_deals: totalDeals || 0,
      approved_deals: approvedDeals || 0,
      pending_deals: pendingDeals || 0,
      rejected_deals: rejectedDeals || 0,
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
