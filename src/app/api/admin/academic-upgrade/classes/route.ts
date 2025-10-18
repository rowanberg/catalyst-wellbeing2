import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile and school
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch all classes for the school with student counts
    // Try to get class_name or name (depending on schema)
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        id,
        class_name,
        grade_level,
        section,
        academic_year,
        created_at
      `)
      .eq('school_id', profile.school_id)

    if (classesError) {
      console.error('Classes fetch error:', classesError)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // Get student counts for each class using student_class_assignments table
    const classesWithCounts = await Promise.all((classes || []).map(async (cls) => {
      const { count } = await supabase
        .from('student_class_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', cls.id)
        .eq('is_active', true)

      // Parse grade level and section from class_name if not available
      let grade = cls.grade_level
      let section = cls.section
      const className = cls.class_name || 'Class 1-A'
      
      if (!grade && className) {
        // Extract from class_name like "Grade 5-A" or "Class 5A"
        const match = className.match(/(\d+)[^\d]*([A-Z])?/i)
        if (match) {
          grade = parseInt(match[1])
          section = match[2] || 'A'
        }
      }

      return {
        id: cls.id,
        name: className,
        grade: grade || 1,
        section: section || 'A',
        studentCount: count || 0,
        currentYear: cls.academic_year || new Date().getFullYear().toString()
      }
    }))

    // Sort by grade and section
    const sortedClasses = classesWithCounts.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade
      return a.section.localeCompare(b.section)
    })

    return NextResponse.json({ 
      classes: sortedClasses,
      success: true 
    })

  } catch (error) {
    console.error('Academic upgrade classes error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
