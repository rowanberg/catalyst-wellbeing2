import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    // Check if we can connect to the database
    const { data: schools, error } = await supabaseAdmin
      .from('schools')
      .select('*')
      .limit(10)

    if (error) {
      console.error('Database connection error:', error)
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      schoolCount: schools?.length || 0,
      schools: schools || [],
      message: schools?.length ? 'Schools found' : 'No schools in database'
    })
  } catch (error) {
    console.error('Test schools API error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Create a test school for verification
    const testSchoolCode = 'TEST12345678'
    
    // Check if test school already exists
    const { data: existing } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('school_code', testSchoolCode)
      .single()

    if (existing) {
      return NextResponse.json({
        message: 'Test school already exists',
        schoolCode: testSchoolCode
      })
    }

    // Create test school
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .insert({
        name: 'Test School',
        address: '123 Test Street, Test City',
        phone: '1234567890',
        email: 'test@testschool.edu',
        admin_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
        school_code: testSchoolCode
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating test school:', error)
      return NextResponse.json({
        error: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test school created',
      school: school,
      schoolCode: testSchoolCode
    })
  } catch (error) {
    console.error('Create test school error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
