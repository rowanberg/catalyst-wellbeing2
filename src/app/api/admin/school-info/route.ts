import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Get school information using admin client to bypass RLS
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()

    if (error) {
      console.error('School info fetch error:', error)
      return NextResponse.json(
        { message: `Failed to fetch school info: ${error.message}` },
        { status: 500 }
      )
    }

    if (!school) {
      return NextResponse.json(
        { message: 'School not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('School info API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
