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

    console.log(`📋 [get-user-deals] Request for userId: ${userId}`)

    if (!token) {
      console.warn('❌ [get-user-deals] No authorization token provided')
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user from JWT token (auth.users)
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser(token)

    if (authError || !authUser) {
      console.error('❌ [get-user-deals] JWT verification failed:', authError?.message)
      return NextResponse.json(
        { message: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      )
    }

    console.log(`✅ [get-user-deals] JWT verified for email: ${authUser.email}`)

    // EMAIL-BASED LOOKUP: Map auth user email → database user
    // This allows web app (JWT) and Android app (database ID) to coexist
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

    // Normalize email for lookup (lowercase, trim whitespace)
    const normalizedEmail = authUser.email?.toLowerCase().trim()

    const { data: userData, error: userLookupError } = await serviceSupabase
      .from('users')
      .select('role, id, email')
      .eq('email', normalizedEmail) // Look up by normalized EMAIL
      .maybeSingle()

    if (userLookupError) {
      console.error('❌ [get-user-deals] Database user lookup error:', userLookupError)
      return NextResponse.json(
        { message: 'Failed to verify user identity' },
        { status: 500 }
      )
    }

    if (!userData) {
      console.error(`❌ [get-user-deals] No database user found for email: ${normalizedEmail}`)
      console.error('   This usually means:')
      console.error('   1. User exists in auth.users but not in public.users')
      console.error('   2. Email mismatch between auth and database')
      console.error('   3. User record was deleted from database')
      return NextResponse.json(
        { message: 'User account not found. Please contact support.' },
        { status: 404 }
      )
    }

    console.log(`✅ [get-user-deals] Database user found: ${userData.id}`)
    console.log(`   Email: ${userData.email}`)
    console.log(`   Role: ${userData.role}`)
    console.log(`   Requested userId: ${userId}`)

    // Authorization check: Allow if viewing own deals OR moderator/admin
    const isViewingOwnDeals = userData.id === userId
    const isModerator = userData.role === 'moderator'
    const isAdmin = userData.role === 'admin'
    const isAuthorized = isViewingOwnDeals || isModerator || isAdmin

    console.log(`🔐 [get-user-deals] Authorization check:`)
    console.log(`   Viewing own deals: ${isViewingOwnDeals}`)
    console.log(`   Is moderator: ${isModerator}`)
    console.log(`   Is admin: ${isAdmin}`)
    console.log(`   Final authorization: ${isAuthorized}`)

    if (!isAuthorized) {
      console.warn(`❌ [get-user-deals] Authorization denied for user ${userData.id} trying to access deals of user ${userId}`)
      return NextResponse.json(
        { message: 'You do not have permission to view these deals' },
        { status: 403 }
      )
    }

    console.log(`✅ [get-user-deals] Authorization granted`)

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
