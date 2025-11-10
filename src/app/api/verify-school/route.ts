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

    // Find the specific school by school code with user limit info
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .select('id, name, school_code, user_limit, current_users, is_active, subscription_status')
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

    // Check if school is active
    if (!school.is_active) {
      return NextResponse.json(
        { 
          message: 'This school account is currently inactive. Please contact school administration.',
          errorCode: 'SCHOOL_INACTIVE'
        },
        { status: 403 }
      )
    }

    // Check user limit
    const currentUsers = school.current_users || 0
    const userLimit = school.user_limit || 100

    if (currentUsers >= userLimit) {
      return NextResponse.json(
        { 
          message: 'User limit reached. Please contact school administration to increase capacity.',
          errorCode: 'USER_LIMIT_REACHED',
          details: {
            currentUsers,
            userLimit
          }
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      schoolName: school.name,
      schoolUuid: school.id,
      verified: true,
      userLimit,
      currentUsers,
      availableSlots: userLimit - currentUsers
    })
  } catch (error) {
    console.error('Verify school API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
