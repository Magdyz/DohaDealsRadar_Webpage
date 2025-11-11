import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // Try to fetch one deal to see what columns exist
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          message: 'Database error',
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    // Get column names from the first row
    const columns = data && data.length > 0 ? Object.keys(data[0]) : []

    return NextResponse.json({
      success: true,
      columns,
      sampleDeal: data?.[0] || null,
      totalDeals: data?.length || 0
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
