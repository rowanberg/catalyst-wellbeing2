import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    // Check database connection and existing schools
    const { data: schools, error } = await supabaseAdmin
      .from('schools')
      .select('*')

    return NextResponse.json({
      success: !error,
      error: error?.message,
      schoolCount: schools?.length || 0,
      schools: schools || []
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST() {
  try {
    // Create a test school
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .insert({
        name: 'Demo School',
        address: '123 Demo Street',
        phone: '1234567890',
        email: 'demo@school.edu',
        admin_id: '00000000-0000-0000-0000-000000000000',
        school_code: 'DEMO12345678'
      })
      .select()
      .single()

    return NextResponse.json({
      success: !error,
      error: error?.message,
      school: school
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
