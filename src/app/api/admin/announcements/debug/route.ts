import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Check if table exists
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('school_announcements')
      .select('*')
      .limit(1)

    if (tableError) {
      return NextResponse.json({
        tableExists: false,
        error: tableError,
        message: 'Table does not exist or has issues',
        suggestion: 'Run database/school_announcements_schema.sql in Supabase SQL Editor'
      })
    }

    // Check table structure - simplified approach
    let structure = 'Table structure check skipped'

    return NextResponse.json({
      tableExists: true,
      recordCount: tableCheck?.length || 0,
      structure: structure || 'Could not retrieve structure',
      message: 'Table exists and is accessible'
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
