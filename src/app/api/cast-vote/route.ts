import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dealId, deviceId, voteType } = body

    if (!dealId || !deviceId || !voteType) {
      return NextResponse.json(
        { message: 'Deal ID, device ID, and vote type are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('deal_id', dealId)
      .eq('device_id', deviceId)
      .single()

    if (existingVote) {
      return NextResponse.json(
        { message: 'You have already voted on this deal' },
        { status: 400 }
      )
    }

    // Insert vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        deal_id: dealId,
        device_id: deviceId,
        vote_type: voteType,
      })

    if (voteError) {
      throw voteError
    }

    // Update deal vote counts
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('hot_count, cold_count')
      .eq('id', dealId)
      .single()

    if (dealError) {
      throw dealError
    }

    const updates = voteType === 'hot'
      ? { hot_count: (deal.hot_count || 0) + 1 }
      : { cold_count: (deal.cold_count || 0) + 1 }

    const { error: updateError } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', dealId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
      hotVotes: voteType === 'hot' ? updates.hot_count : deal.hot_count,
      coldVotes: voteType === 'cold' ? updates.cold_count : deal.cold_count,
    })
  } catch (error: any) {
    console.error('Cast vote API error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to cast vote' },
      { status: 500 }
    )
  }
}
