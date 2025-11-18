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

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    // SECURITY CHECK: Verify authentication for accessing user stats
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
        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data: userData, error: userLookupError } = await serviceSupabase
          .from('users')
          .select('role, id')
          .eq('email', authUser.email) // Look up by EMAIL not ID
          .maybeSingle()

        if (userData) {
          // Allow if user is viewing their own stats or is moderator/admin
          isAuthorized =
            userData.id === userId ||
            userData.role === 'moderator' ||
            userData.role === 'admin'
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { message: 'You do not have permission to view these stats' },
        { status: 403 }
      )
    }

    // SECURITY FIX: Use service role key to count all deal statuses (pending, approved, rejected)
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

    // PERFORMANCE: Fetch all deals once and count in-memory (4x faster than 4 separate queries)
    const { data: userDeals, error: dealsError } = await supabase
      .from('deals')
      .select('status')
      .eq('submitted_by_user_id', userId)

    if (dealsError) {
      throw dealsError
    }

    // Count by status in-memory
    const stats = {
      total_deals: userDeals.length,
      approved_deals: userDeals.filter(d => d.status === 'approved').length,
      pending_deals: userDeals.filter(d => d.status === 'pending').length,
      rejected_deals: userDeals.filter(d => d.status === 'rejected').length,
    }

    // PERFORMANCE: Cache user stats for 5 minutes
    return NextResponse.json({ stats }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    return createErrorResponse(error, 500, 'Get User Stats API')
  }
}
