import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id') || 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
    const classId = searchParams.get('class_id') || '1aed301a-7e74-4c8c-a142-0d094bbf9712'

    console.log('🔍 Debug API called with:', { schoolId, classId })

    const results: any = {
      schoolId,
      classId,
      checks: {}
    }

    // Check 1: Do we have any profiles at all?
    try {
      const { data: allProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, role, school_id')
        .limit(10)
      
      results.checks.allProfiles = {
        success: !profilesError,
        error: profilesError?.message,
        count: allProfiles?.length || 0,
        data: allProfiles
      }
    } catch (error: any) {
      results.checks.allProfiles = { success: false, error: error?.message || 'Unknown error' }
    }

    // Check 2: Do we have students in this school?
    try {
      const { data: schoolStudents, error: schoolError } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('school_id', schoolId)
        .eq('role', 'student')
      
      results.checks.schoolStudents = {
        success: !schoolError,
        error: schoolError?.message,
        count: schoolStudents?.length || 0,
        data: schoolStudents
      }
    } catch (error: any) {
      results.checks.schoolStudents = { success: false, error: error?.message || 'Unknown error' }
    }

    // Check 3: Does the student_class_assignments table exist?
    try {
      const { data: assignments, error: assignmentError } = await supabaseAdmin
        .from('student_class_assignments')
        .select('*')
        .limit(5)
      
      results.checks.classAssignments = {
        success: !assignmentError,
        error: assignmentError?.message,
        count: assignments?.length || 0,
        data: assignments
      }
    } catch (error: any) {
      results.checks.classAssignments = { success: false, error: error?.message || 'Unknown error' }
    }

    // Check 4: Does the classes table exist and have our class?
    try {
      const { data: classes, error: classError } = await supabaseAdmin
        .from('classes')
        .select('*')
        .eq('id', classId)
      
      results.checks.classExists = {
        success: !classError,
        error: classError?.message,
        count: classes?.length || 0,
        data: classes
      }
    } catch (error: any) {
      results.checks.classExists = { success: false, error: error?.message || 'Unknown error' }
    }

    // Check 5: Try the RPC function
    try {
      const { data: rpcResult, error: rpcError } = await supabaseAdmin
        .rpc('get_class_students', { 
          p_school_id: schoolId,
          p_class_id: classId 
        })
      
      results.checks.rpcFunction = {
        success: !rpcError,
        error: rpcError?.message,
        count: rpcResult?.length || 0,
        data: rpcResult
      }
    } catch (error: any) {
      results.checks.rpcFunction = { success: false, error: error?.message || 'Unknown error' }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('❌ Debug API error:', error)
    return NextResponse.json(
      { error: 'Debug API failed', details: (error as any)?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
