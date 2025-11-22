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

// Simple GET for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Attendance GET working', 
    timestamp: new Date().toISOString(),
    url: request.url 
  })
}

// Save attendance records to database
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const supabase = await createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile for school_id and profile.id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { attendanceData, date } = body

    if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return NextResponse.json({ error: 'No attendance data provided' }, { status: 400 })
    }

    // Simple guard to avoid very large payloads causing long upserts
    if (attendanceData.length > 200) {
      return NextResponse.json({
        error: 'Too many attendance records. Please submit at most 200 at a time.'
      }, { status: 400 })
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Prepare attendance records with correct column names
    // Using: date, status (NOT attendance_date, attendance_status)
    // IMPORTANT: teacher_id must be profile.id (not user.id) because FK references profiles table
    const attendanceRecords = attendanceData.map((record: any) => ({
      student_id: record.student_id,
      teacher_id: profile.id,  // Use profile.id, not user.id
      school_id: profile.school_id,
      date: date,
      status: record.status,
      notes: record.notes || null
    }))

    const dbStart = Date.now()

    // Use upsert to handle updates (UNIQUE constraint on student_id, date).
    // We don't need the inserted rows back here, so skip .select() for speed.
    const { error: insertError } = await supabase
      .from('attendance')
      .upsert(attendanceRecords, {
        onConflict: 'student_id,date',
        ignoreDuplicates: false
      })

    if (insertError) {
      console.error('❌ Attendance upsert error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save attendance', 
        details: insertError.message 
      }, { status: 500 })
    }

    const totalMs = Date.now() - startTime
    const dbMs = Date.now() - dbStart
    console.log(`✅ Attendance saved: ${attendanceRecords.length} records in ${totalMs}ms (DB ${dbMs}ms)`)    
    
    return NextResponse.json({ 
      success: true,
      message: 'Attendance saved successfully',
      count: attendanceRecords.length,
      duration_ms: totalMs,
      db_duration_ms: dbMs,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
