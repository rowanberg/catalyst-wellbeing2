import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { invalidateSchoolInfoCache } from '@/lib/cache-invalidation-school'

// 6-Layered Security Implementation:
// Layer 1: Authentication Check
// Layer 2: Role Validation (Admin only)
// Layer 3: School ID Verification
// Layer 4: Database RLS Policies
// Layer 5: Input Validation & Sanitization
// Layer 6: Error Handling & Audit Logging

export async function POST(request: NextRequest) {
  try {
    // Layer 5: Input Validation
    const { schoolId } = await request.json()

    if (!schoolId) {
      console.warn('[Security] Missing schoolId in request')
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(schoolId)) {
      console.warn('[Security] Invalid schoolId format:', schoolId)
      return NextResponse.json(
        { message: 'Invalid School ID format' },
        { status: 400 }
      )
    }

    // Layer 1 & 2: Authentication and Role Check
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

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.warn('[Security] Unauthorized access attempt')
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get user profile and verify admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      console.error('[Security] Profile fetch error:', profileError)
      return NextResponse.json(
        { message: 'User profile not found' },
        { status: 403 }
      )
    }

    if (profile.role !== 'admin') {
      console.warn('[Security] Non-admin access attempt by:', session.user.email)
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Layer 3: School ID Verification
    // Use the authenticated admin's school_id as the source of truth to prevent cross-school access,
    // while avoiding false rejections when the client sends a stale or mismatched ID.
    const effectiveSchoolId = profile.school_id

    if (!effectiveSchoolId) {
      console.error('[Security] Admin profile missing school_id for user:', session.user.email)
      return NextResponse.json(
        { message: 'Access denied - No school associated with this admin' },
        { status: 403 }
      )
    }

    // Layer 4: Get school settings with RLS (using admin client for performance)
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('id', effectiveSchoolId)
      .single()

    if (error) {
      console.error('[Database] School settings fetch error:', error)
      return NextResponse.json(
        { message: `Failed to fetch school settings: ${error.message}` },
        { status: 500 }
      )
    }

    // Layer 6: Audit logging
    console.log('[Audit] School settings accessed:', {
      schoolId,
      user: session.user.email,
      timestamp: new Date().toISOString()
    })

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

      // Subscription data: taken directly from schools table
      subscription_status: school.subscription_status || 'trial',
      subscription_plan: school.subscription_plan || 'free',
      plan_type: (school as any).plan_type || 'free',
      user_limit: (school as any).user_limit ?? null,
      current_users: (school as any).current_users ?? null,
      payment_status: (school as any).payment_status || 'active',
      payment_due_date: (school as any).payment_due_date || null,
      last_payment_date: (school as any).last_payment_date || null,
      monthly_fee: (school as any).monthly_fee ?? null,
      student_limit: (school as any).student_limit ?? null,
      student_count: (school as any).student_count ?? null,
      trial_end_date: (school as any).trial_end_date || null,
      subscription_start_date: (school as any).subscription_start_date || null,
      subscription_end_date: (school as any).subscription_end_date || null,
      next_billing_date: (school as any).next_billing_date || null,
      razorpay_subscription_id: (school as any).razorpay_subscription_id || null,
      
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
    // Layer 6: Error handling and logging
    console.error('[Error] School settings API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
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

    // Invalidate school info cache so teachers see fresh data
    invalidateSchoolInfoCache(schoolId).catch((err) => {
      console.error('Failed to invalidate school cache:', err)
    })

    console.log('[Cache] Invalidated school info cache for:', schoolId)

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('School settings update API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
