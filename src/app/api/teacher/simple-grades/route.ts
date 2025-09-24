import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create Supabase client with cookie-based auth
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// GET - Simple endpoint to get teacher's grades from their class assignments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Simple grades: Getting assignments for user:', user.id)

    // Get teacher's class assignments directly
    const { data: assignments, error: assignmentsError } = await supabase
      .from('teacher_class_assignments')
      .select(`
        class_id,
        classes (
          id,
          name,
          grade_level_id,
          grade_levels (
            id,
            name,
            level
          )
        )
      `)
      .eq('teacher_id', user.id)
      .eq('is_active', true)

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    console.log('Simple grades: Found assignments:', assignments?.length || 0)

    // Process assignments to get unique grades
    const gradesMap = new Map()
    
    assignments?.forEach((assignment: any) => {
      const classData = assignment.classes
      const gradeLevel = classData.grade_levels
      
      if (!gradesMap.has(gradeLevel.id)) {
        gradesMap.set(gradeLevel.id, {
          grade_level_id: gradeLevel.id,
          grade_name: gradeLevel.name,
          grade_level: gradeLevel.level,
          total_classes: 0,
          total_students: 0
        })
      }
      gradesMap.get(gradeLevel.id).total_classes += 1
    })

    const grades = Array.from(gradesMap.values()).sort((a: any, b: any) => a.grade_level - b.grade_level)
    
    console.log('Simple grades: Processed grades:', grades.length)

    return NextResponse.json({
      grades: grades,
      success: true
    })

  } catch (error: any) {
    console.error('Error in simple grades GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
