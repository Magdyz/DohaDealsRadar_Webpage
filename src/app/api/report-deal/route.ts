// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export type ReportReason = 'spam' | 'inappropriate' | 'expired' | 'misleading'

const DAILY_REPORT_LIMIT = 5
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { dealId, userId, reason, details } = await request.json()

    if (!dealId || !userId || !reason) {
      return NextResponse.json(
        { error: 'Deal ID, user ID, and reason are required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate that high-severity reports have sufficient details
    const highSeverityReasons: ReportReason[] = ['spam', 'misleading']
    if (highSeverityReasons.includes(reason) && (!details || details.trim().length < 30)) {
      return NextResponse.json(
        { error: 'High-severity reports require at least 30 characters of details' },
        { status: 400 }
      )
    }

    // Validate reason
    const validReasons: ReportReason[] = ['spam', 'inappropriate', 'expired', 'misleading']
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid report reason' },
        { status: 400 }
      )
    }

    // Normalize reason to lowercase (Postgres ENUM is case-sensitive)
    const normalizedReason = reason.toLowerCase()

    // Check if user has already reported this deal
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('deal_id', dealId)
      .eq('device_id', userId)
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this deal' },
        { status: 409 }
      )
    }

    // Check daily report limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todayReports, error: countError } = await supabase
      .from('reports')
      .select('id')
      .eq('device_id', userId)
      .gte('created_at', today.toISOString())

    if (countError) {
      console.error('Error counting reports:', countError)
      return NextResponse.json(
        { error: 'Failed to check report limit' },
        { status: 500 }
      )
    }

    if (todayReports && todayReports.length >= DAILY_REPORT_LIMIT) {
      return NextResponse.json(
        { error: `You can only report ${DAILY_REPORT_LIMIT} deals per day` },
        { status: 429 }
      )
    }

    // Create the report
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        deal_id: dealId,
        device_id: userId,
        reason: normalizedReason,
        note: details || null,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error creating report:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      )
    }

    // Get the total report count for this deal
    const { count } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('deal_id', dealId)

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      reportCount: count || 0,
    })
  } catch (error: any) {
    console.error('Error in report-deal API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
