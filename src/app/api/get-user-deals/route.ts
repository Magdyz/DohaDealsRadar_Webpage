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
      .select('*', { count: 'exact' })
      .eq('submitted_by_user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    const total = count || 0
    const hasMore = total > page * limit

    return NextResponse.json({
      deals: deals || [],
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
