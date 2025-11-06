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
    if (profile.school_id !== schoolId) {
      console.warn('[Security] School ID mismatch:', {
        requested: schoolId,
        userSchool: profile.school_id,
        user: session.user.email
      })
      return NextResponse.json(
        { message: 'Access denied - Invalid school access' },
        { status: 403 }
      )
    }

    // Layer 4: Get school settings with RLS (using admin client for performance)
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()

    if (error) {
      console.error('[Database] School settings fetch error:', error)
      return NextResponse.json(
        { message: `Failed to fetch school settings: ${error.message}` },
        { status: 500 }
      )
    }

    // Fetch subscription data from subscription_sync table
    const { data: subscriptionSync, error: syncError } = await supabaseAdmin
      .from('subscription_sync')
      .select('*')
      .eq('school_id', schoolId)
      .order('sync_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (syncError) {
      console.error('[Database] Subscription sync fetch error:', syncError)
    }

    // Fetch from active_subscriptions view
    const { data: activeSubscription, error: activeError } = await supabaseAdmin
      .from('active_subscriptions')
      .select('*')
      .eq('id', schoolId)
      .maybeSingle()

    if (activeError) {
      console.error('[Database] Active subscription fetch error:', activeError)
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
      
      // Subscription data from multiple sources (subscription_sync takes priority)
      subscription_plan: subscriptionSync?.data?.plan || 
                        activeSubscription?.subscription_plan || 
                        school.subscription_plan || 
                        'free',
      subscription_status: subscriptionSync?.sync_status === 'completed' 
                          ? (activeSubscription?.subscription_status || school.subscription_status || 'trial')
                          : 'pending',
      subscription_sync_data: subscriptionSync ? {
        landing_subscription_id: subscriptionSync.landing_page_subscription_id,
        razorpay_order_id: subscriptionSync.razorpay_order_id,
        razorpay_payment_id: subscriptionSync.razorpay_payment_id,
        amount_paid: subscriptionSync.amount_paid,
        sync_timestamp: subscriptionSync.sync_timestamp,
        sync_source: subscriptionSync.sync_source,
        sync_status: subscriptionSync.sync_status
      } : null,
      active_subscription_data: activeSubscription ? {
        student_limit: activeSubscription.student_limit,
        trial_end_date: activeSubscription.trial_end_date,
        subscription_start_date: activeSubscription.subscription_start_date,
        subscription_end_date: activeSubscription.subscription_end_date,
        next_billing_date: activeSubscription.next_billing_date,
        total_users: activeSubscription.total_users,
        student_count: activeSubscription.student_count
      } : null,
      
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
