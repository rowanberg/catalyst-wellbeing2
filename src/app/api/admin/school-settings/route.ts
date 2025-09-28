import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Get school settings with default values
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()

    if (error) {
      console.error('School settings fetch error:', error)
      return NextResponse.json(
        { message: `Failed to fetch school settings: ${error.message}` },
        { status: 500 }
      )
    }

    // Return settings with defaults for missing fields
    const settings = {
      id: school.id,
      name: school.name,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      website: school.website || '',
      school_code: school.school_code,
      timezone: school.timezone || 'America/New_York',
      academic_year_start: school.academic_year_start || '2024-09-01',
      academic_year_end: school.academic_year_end || '2025-06-30',
      notification_settings: school.notification_settings || {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        weekly_reports: true,
        urgent_alerts: true
      },
      privacy_settings: school.privacy_settings || {
        data_retention_days: 365,
        allow_analytics: true,
        share_anonymous_data: false,
        require_parent_consent: true
      },
      wellbeing_settings: school.wellbeing_settings || {
        daily_check_ins: true,
        anonymous_reporting: true,
        crisis_intervention: true,
        counselor_access: true
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('School settings API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { schoolId, settings } = await request.json()

    if (!schoolId || !settings) {
      return NextResponse.json(
        { message: 'School ID and settings are required' },
        { status: 400 }
      )
    }

    // Update school settings
    const { error } = await supabaseAdmin
      .from('schools')
      .update({
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        timezone: settings.timezone,
        academic_year_start: settings.academic_year_start,
        academic_year_end: settings.academic_year_end,
        notification_settings: settings.notification_settings,
        privacy_settings: settings.privacy_settings,
        wellbeing_settings: settings.wellbeing_settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', schoolId)

    if (error) {
      console.error('School settings update error:', error)
      return NextResponse.json(
        { message: `Failed to update school settings: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('School settings update API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
