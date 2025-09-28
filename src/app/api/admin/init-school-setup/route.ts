import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('=== Initialize School Setup API Called ===')
    
    const body = await request.json()
    const { schoolId, schoolName, schoolCode } = body
    
    if (!schoolId) {
      return NextResponse.json({ error: 'School ID required' }, { status: 400 })
    }

    // Check if school_details record already exists
    const { data: existing } = await supabaseAdmin
      .from('school_details')
      .select('id, status')
      .eq('school_id', schoolId)
      .single()

    if (existing) {
      console.log('School details already exist with status:', existing.status)
      return NextResponse.json({ 
        message: 'School details already initialized',
        status: existing.status
      })
    }

    // Create initial school_details record with 'not_completed' status
    const initialData = {
      school_id: schoolId,
      school_name: schoolName || 'New School',
      school_code: schoolCode || 'NEWSCH',
      status: 'not_completed',
      setup_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: schoolDetails, error: insertError } = await supabaseAdmin
      .from('school_details')
      .insert(initialData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating initial school details:', insertError)
      return NextResponse.json({ 
        error: 'Failed to initialize school setup',
        details: insertError.message
      }, { status: 500 })
    }

    console.log('School details initialized successfully with status: not_completed')

    return NextResponse.json({ 
      success: true,
      message: 'School setup initialized',
      details: schoolDetails,
      status: 'not_completed'
    })

  } catch (error) {
    console.error('Initialize school setup API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
