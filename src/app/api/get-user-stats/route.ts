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
      // Verify user from JWT token
      const authSupabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { user }, error: authError } = await authSupabase.auth.getUser(token)

      if (!authError && user) {
        // Use service role key to get user role
        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data: userData, error: userLookupError } = await serviceSupabase
          .from('users')
          .select('role, id')
          .eq('id', user.id)
          .maybeSingle() // Use maybeSingle() instead of single() to handle missing users gracefully

        if (userData) {
          // Allow if user is viewing their own stats or is moderator/admin
          isAuthorized =
            userData.id === userId ||
            userData.role === 'moderator' ||
            userData.role === 'admin'
        } else if (user.id === userId) {
          // Allow users to view their own stats even if not in users table yet
          isAuthorized = true
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
    return createErrorResponse(error, 500, 'Get User Stats API')
  }
}
