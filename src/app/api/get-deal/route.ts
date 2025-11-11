import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dealId = searchParams.get('dealId')

    if (!dealId) {
      return NextResponse.json({ message: 'Deal ID is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: deal, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()

    if (error) {
      throw error
    }

    if (!deal) {
      return NextResponse.json({ message: 'Deal not found' }, { status: 404 })
    }

    return NextResponse.json({ deal })
  } catch (error: any) {
    console.error('Get deal API error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch deal' },
      { status: 500 }
    )
  }
}
