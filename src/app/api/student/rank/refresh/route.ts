import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Call the refresh function
    const { data, error } = await supabase
      .rpc('refresh_student_ranks')

    if (error) {
      console.error('Error refreshing student ranks:', error)
      return NextResponse.json(
        { error: 'Failed to refresh rankings', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Rankings refreshed successfully',
      students_updated: data 
    })
  } catch (error: any) {
    console.error('Unexpected error refreshing ranks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
