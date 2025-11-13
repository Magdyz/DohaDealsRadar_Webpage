// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export type ReportReason = 'spam' | 'inappropriate' | 'expired' | 'misleading'

const DAILY_REPORT_LIMIT = 5

export async function POST(request: NextRequest) {
  try {
    const { dealId, userId, reason, details } = await request.json()

    if (!dealId || !userId || !reason) {
      return NextResponse.json(
        { error: 'Deal ID, user ID, and reason are required' },
        { status: 400 }
      )
    }

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

    // Check if user has already reported this deal
    const { data: existingReport } = await supabase
      .from('deal_reports')
      .select('id')
      .eq('deal_id', dealId)
      .eq('reported_by', userId)
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
      .from('deal_reports')
      .select('id')
      .eq('reported_by', userId)
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
      .from('deal_reports')
      .insert({
        deal_id: dealId,
        reported_by: userId,
        reason: reason,
        details: details || null,
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
      .from('deal_reports')
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
