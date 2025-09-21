import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const gradeLevel = searchParams.get('gradeLevel')

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 })
    }

    if (!gradeLevel) {
      return NextResponse.json({ error: 'Grade level is required' }, { status: 400 })
    }

    // First, verify the school exists and get its UUID
    console.log('DEBUG: Looking up school with code:', schoolId)
    console.log('DEBUG: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('school_code', schoolId)
    
    console.log('DEBUG: School query result:', { schools, error: schoolError })
    
    if (schoolError) {
      console.error('School query error:', schoolError)
      return NextResponse.json({ 
        error: 'Database error while looking up school',
        debug: {
          schoolCode: schoolId,
          error: schoolError.message,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
        }
      }, { status: 500 })
    }
    
    if (!schools || schools.length === 0) {
      console.error('No school found with code:', schoolId)
      console.log('DEBUG: Available schools query for debugging...')
      
      // Debug query to see what schools exist
      const { data: allSchools } = await supabase
        .from('schools')
        .select('school_code, name')
        .limit(5)
      
      console.log('DEBUG: Sample schools in database:', allSchools)
      return NextResponse.json({ 
        error: 'School not found',
        debug: {
          schoolCode: schoolId,
          error: 'No school exists with this code'
        }
      }, { status: 404 })
    }
    
    if (schools.length > 1) {
      console.error('Multiple schools found with same code:', schoolId)
      return NextResponse.json({ 
        error: 'Multiple schools found with same code',
        debug: {
          schoolCode: schoolId,
          count: schools.length
        }
      }, { status: 409 })
    }
    
    const school = schools[0]

    // Get the grade level ID for the school
    const { data: gradeLevelData, error: gradeLevelError } = await supabase
      .from('grade_levels')
      .select('id, grade_level, grade_name')
      .eq('school_id', school.id)
      .eq('grade_level', gradeLevel)
      .eq('is_active', true)
      .single()

    if (gradeLevelError || !gradeLevelData) {
      console.error('Grade level not found:', gradeLevelError)
      // If no grade level found, return empty classes array
      return NextResponse.json({ 
        classes: [],
        message: 'No grade level configuration found for this school',
        debug: {
          schoolId: school.id,
          gradeLevel,
          error: gradeLevelError?.message
        }
      })
    }

    // Fetch classes for the grade level
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        id,
        class_name,
        class_code,
        subject,
        room_number,
        max_students,
        current_students,
        is_active
      `)
      .eq('school_id', school.id)
      .eq('grade_level_id', gradeLevelData.id)
      .eq('is_active', true)
      .order('class_name')

    if (classesError) {
      console.error('Error fetching classes:', classesError)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    return NextResponse.json({
      classes: classes || [],
      gradeLevel: {
        id: gradeLevelData.id,
        level: gradeLevelData.grade_level,
        name: gradeLevelData.grade_name
      },
      school: {
        id: school.id,
        name: school.name
      }
    })

  } catch (error) {
    console.error('Error in registration classes API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
