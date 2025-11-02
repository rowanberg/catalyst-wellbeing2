import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await request.json()

    console.log('Verifying school ID:', schoolId)

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    if (schoolId.length !== 12) {
      return NextResponse.json(
        { message: 'School ID must be exactly 12 characters' },
        { status: 400 }
      )
    }

    // Find the specific school by school code
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .select('id, name, school_code')
      .eq('school_code', schoolId)
      .single()

    console.log('School query result:', { school, error })

    if (error) {
      console.error('Database error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'School not found with this ID' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!school) {
      return NextResponse.json(
        { message: 'School not found with this ID' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      schoolName: school.name,
      schoolUuid: school.id,
      verified: true
    })
  } catch (error) {
    console.error('Verify school API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
