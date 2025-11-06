import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Public endpoint for registration page to fetch email domain settings
export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(schoolId)) {
      return NextResponse.json(
        { message: 'Invalid School ID format' },
        { status: 400 }
      )
    }

    // Fetch only public settings (email domain restrictions)
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .select('privacy_settings')
      .eq('id', schoolId)
      .single()

    if (error || !school) {
      console.error('School not found:', error)
      return NextResponse.json(
        { message: 'School not found' },
        { status: 404 }
      )
    }

    // Return only email domain settings (not sensitive data)
    return NextResponse.json({
      privacy_settings: {
        restrict_email_domains: school.privacy_settings?.restrict_email_domains || false,
        allowed_email_domain: school.privacy_settings?.allowed_email_domain || ''
      }
    })
  } catch (error) {
    console.error('Public school settings API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
