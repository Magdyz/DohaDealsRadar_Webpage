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
    console.error('Get deals API error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}
