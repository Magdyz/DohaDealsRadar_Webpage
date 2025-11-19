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

    console.log(`📊 [get-user-stats] Request for userId: ${userId}`)

    if (!token) {
      console.warn('❌ [get-user-stats] No authorization token provided')
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user from JWT token (auth.users)
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser(token)

    if (authError || !authUser) {
      console.error('❌ [get-user-stats] JWT verification failed:', authError?.message)
      return NextResponse.json(
        { message: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      )
    }

    console.log(`✅ [get-user-stats] JWT verified for email: ${authUser.email}`)

    // EMAIL-BASED LOOKUP: Map auth user email → database user
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

    // Normalize email for lookup (lowercase, trim whitespace)
    const normalizedEmail = authUser.email?.toLowerCase().trim()

    const { data: userData, error: userLookupError } = await serviceSupabase
      .from('users')
      .select('role, id, email')
      .eq('email', normalizedEmail) // Look up by normalized EMAIL
      .maybeSingle()

    if (userLookupError) {
      console.error('❌ [get-user-stats] Database user lookup error:', userLookupError)
      return NextResponse.json(
        { message: 'Failed to verify user identity' },
        { status: 500 }
      )
    }

    if (!userData) {
      console.error(`❌ [get-user-stats] No database user found for email: ${normalizedEmail}`)
      return NextResponse.json(
        { message: 'User account not found. Please contact support.' },
        { status: 404 }
      )
    }

    console.log(`✅ [get-user-stats] Database user found: ${userData.id}`)

    // Authorization check: Allow if viewing own stats OR moderator/admin
    const isViewingOwnStats = userData.id === userId
    const isModerator = userData.role === 'moderator'
    const isAdmin = userData.role === 'admin'
    const isAuthorized = isViewingOwnStats || isModerator || isAdmin

    console.log(`🔐 [get-user-stats] Authorization: ${isAuthorized} (own: ${isViewingOwnStats}, mod: ${isModerator}, admin: ${isAdmin})`)

    if (!isAuthorized) {
      console.warn(`❌ [get-user-stats] Authorization denied for user ${userData.id} trying to access stats of user ${userId}`)
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
