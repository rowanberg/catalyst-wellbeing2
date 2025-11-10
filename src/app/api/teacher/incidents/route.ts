import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Fetch teacher's incidents
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get teacher profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can view incidents' },
        { status: 403 }
      )
    }

    // Fetch incidents for the teacher's school
    const { data: incidents, error: incidentsError } = await supabase
      .from('incident_reports')
      .select(`
        id,
        incident_type,
        severity,
        description,
        location,
        incident_date,
        students_involved,
        student_name_text,
        class_id,
        class_name,
        status,
        created_at,
        updated_at,
        reported_by,
        school_id
      `)
      .eq('school_id', profile.school_id)
      .eq('reported_by', user.id)  // Use user.id not profile.id - FK references profiles(user_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (incidentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch incidents' },
        { status: 500 }
      )
    }

    // Get student names for incidents - optimized to only fetch when needed
    const studentIds = incidents?.length > 0 
      ? Array.from(new Set(incidents.flatMap(inc => inc.students_involved || [])))
      : []

    const studentMap: Record<string, any> = studentIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name, first_name, grade_level')
          .in('id', studentIds)
          .then(({ data }) => 
            data ? Object.fromEntries(data.map(s => [s.id, s])) : {}
          )
      : {}

    // Transform incidents to match frontend interface
    const transformedIncidents = incidents?.map(incident => {
      const studentId = incident.students_involved?.[0]
      const student = studentId ? studentMap[studentId] : null
      
      // Use student profile name if available, otherwise use stored text name, or fallback
      const studentName = student?.full_name 
        || student?.first_name 
        || incident.student_name_text 
        || 'Unknown Student'
      
      return {
        id: incident.id,
        student_id: studentId || '',
        teacher_id: incident.reported_by,
        type: incident.incident_type,
        severity: incident.severity,
        description: incident.description,
        created_at: incident.created_at,
        student_name: studentName,
        student_grade: student?.grade_level,
        class_name: incident.class_name,
        resolution_status: incident.status === 'open' ? 'pending' 
          : incident.status === 'investigating' ? 'in_progress' 
          : 'resolved',
        location: incident.location,
        incident_date: incident.incident_date
      }
    }) || []

    const response = NextResponse.json({
      success: true,
      incidents: transformedIncidents,
      count: transformedIncidents.length
    })

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    
    return response

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new incident
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get teacher profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can create incidents' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { 
      student_id, 
      student_name,
      class_id,
      class_name,
      type, 
      severity, 
      description,
      location,
      incident_date 
    } = body

    // Validation
    if (!student_name?.trim()) {
      return NextResponse.json(
        { error: 'Student name is required' },
        { status: 400 }
      )
    }

    if (!description?.trim() || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 }
      )
    }

    if (!['behavioral', 'academic', 'positive'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid incident type' },
        { status: 400 }
      )
    }

    if (!['low', 'medium', 'high'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      )
    }

    // If student_id is provided, verify it exists
    let verifiedStudentId = null
    if (student_id) {
      const { data: student } = await supabase
        .from('profiles')
        .select('id, school_id, role')
        .eq('id', student_id)
        .eq('role', 'student')
        .single()

      if (student && student.school_id === profile.school_id) {
        verifiedStudentId = student_id
      }
    }

    const incidentData = {
      school_id: profile.school_id,
      reported_by: user.id,  // Use user.id not profile.id - FK references profiles(user_id)
      incident_type: type,
      severity: severity,
      description: description.trim(),
      location: location || null,
      incident_date: incident_date || new Date().toISOString(),
      students_involved: verifiedStudentId ? [verifiedStudentId] : [],
      student_name_text: !verifiedStudentId ? student_name : null,  // Store name if no profile linked
      class_id: class_id || null,  // Store class ID if provided
      class_name: class_name || null,  // Store class name if provided
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Create incident report
    const { data: incident, error: insertError } = await supabase
      .from('incident_reports')
      .insert(incidentData)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create incident', details: insertError.message },
        { status: 500 }
      )
    }

    // Get student info for response
    let studentInfo: { id: string; full_name?: string; first_name?: string; grade_level?: string } | null = null
    if (verifiedStudentId) {
      const { data: student } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, grade_level')
        .eq('id', verifiedStudentId)
        .single()
      
      if (student) {
        studentInfo = student
      }
    }

    // Return formatted incident
    const formattedIncident = {
      id: incident.id,
      student_id: verifiedStudentId || '',
      teacher_id: user.id,  // Use user.id for consistency
      type: incident.incident_type,
      severity: incident.severity,
      description: incident.description,
      created_at: incident.created_at,
      student_name: studentInfo?.full_name || studentInfo?.first_name || incident.student_name_text || student_name,
      student_grade: studentInfo?.grade_level,
      resolution_status: 'pending',
      location: incident.location,
      incident_date: incident.incident_date
    }

    return NextResponse.json({
      success: true,
      message: 'Incident created successfully',
      incident: formattedIncident
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update incident (optional for future use)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can update incidents' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { incident_id, status, resolution_notes } = body

    if (!incident_id) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      )
    }

    // Verify incident belongs to this teacher's school
    const { data: existingIncident } = await supabase
      .from('incident_reports')
      .select('id, school_id, reported_by')
      .eq('id', incident_id)
      .single()

    if (!existingIncident || existingIncident.school_id !== profile.school_id) {
      return NextResponse.json(
        { error: 'Incident not found or access denied' },
        { status: 404 }
      )
    }

    // Update incident
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString()
      }
    }

    if (resolution_notes) {
      updateData.resolution_notes = resolution_notes
    }

    const { data: updatedIncident, error: updateError } = await supabase
      .from('incident_reports')
      .update(updateData)
      .eq('id', incident_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update incident' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Incident updated successfully',
      incident: updatedIncident
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete incident (optional for future use)
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can delete incidents' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const incident_id = searchParams.get('id')

    if (!incident_id) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      )
    }

    // Verify incident belongs to this teacher
    const { data: existingIncident } = await supabase
      .from('incident_reports')
      .select('id, school_id, reported_by')
      .eq('id', incident_id)
      .single()

    if (!existingIncident || 
        existingIncident.school_id !== profile.school_id ||
        existingIncident.reported_by !== user.id) {
      // Fix: Use user.id instead of profile.id to match the way incidents are created
      console.log('Access denied:', {
        incident: existingIncident?.id,
        reportedBy: existingIncident?.reported_by,
        userId: user.id,
        profileId: profile.id,
        mismatch: existingIncident?.reported_by !== user.id
      })
      return NextResponse.json(
        { error: 'Incident not found or access denied' },
        { status: 404 }
      )
    }

    // Delete incident
    const { error: deleteError } = await supabase
      .from('incident_reports')
      .delete()
      .eq('id', incident_id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete incident' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Incident deleted successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
