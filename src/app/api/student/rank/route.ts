import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Get student ID from query params
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Call the RPC function to get rank data
    const { data, error } = await supabase
      .rpc('get_student_rank_data', { p_student_id: studentId })

    if (error) {
      console.error('Error fetching rank data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch rank data', details: error.message },
        { status: 500 }
      )
    }

    // Check if data was found
    if (data && typeof data === 'object' && 'error' in data) {
      return NextResponse.json(
        { error: 'Student rank data not found' },
        { status: 404 }
      )
    }

    // Cache for 1 hour (ranks update nightly anyway)
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    })
  } catch (error: any) {
    console.error('Unexpected error in rank API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
