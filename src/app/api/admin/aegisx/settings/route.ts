import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
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

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('role, school_id')
            .eq('user_id', user.id)

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const profile = profiles[0]

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch settings for the school
        const { data: settings, error } = await supabaseAdmin
            .from('aegisx_settings')
            .select('*')
            .eq('school_id', profile.school_id)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching settings:', error)
            return NextResponse.json({
                settings: null,
                message: 'Settings table not found. Please run the aegisx_settings_analytics.sql migration.'
            })
        }

        // If no settings exist, return defaults
        if (!settings) {
            const defaultSettings = {
                access_logging_enabled: true,
                log_retention_days: 365,
                auto_archive_enabled: true,
                deny_unknown_cards: true,
                card_expiry_warning_days: 30,
                max_failed_attempts: 3,
                lock_duration_minutes: 30,
                require_pin_for_sensitive_areas: false,
                realtime_alerts_enabled: true,
                email_notifications_enabled: false,
                admin_email: null,
                alert_threshold_per_hour: 10,
                daily_summary_enabled: true,
                summary_time: '18:00:00',
                auto_sync_interval_minutes: 5,
                offline_mode_enabled: true,
                reader_health_check_enabled: true,
                auto_restart_on_failure: false,
                export_enabled: true,
                backup_enabled: true,
                backup_frequency_days: 7,
                gdpr_compliance_mode: true,
                hourly_analytics_enabled: true,
                student_tracking_enabled: true,
                peak_hours_alerts: false
            }
            return NextResponse.json({ settings: defaultSettings, isDefault: true })
        }

        return NextResponse.json({ settings })

    } catch (error: any) {
        console.error('Error in GET /api/admin/aegisx/settings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
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

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('role, school_id')
            .eq('user_id', user.id)

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const profile = profiles[0]

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()

        // Check if settings exist
        const { data: existingSettings } = await supabaseAdmin
            .from('aegisx_settings')
            .select('id')
            .eq('school_id', profile.school_id)
            .single()

        let result
        if (existingSettings) {
            // Update existing settings
            result = await supabaseAdmin
                .from('aegisx_settings')
                .update({
                    ...body,
                    updated_by: user.id,
                    updated_at: new Date().toISOString()
                })
                .eq('school_id', profile.school_id)
                .select()
                .single()
        } else {
            // Insert new settings
            result = await supabaseAdmin
                .from('aegisx_settings')
                .insert({
                    school_id: profile.school_id,
                    ...body,
                    updated_by: user.id
                })
                .select()
                .single()
        }

        if (result.error) {
            console.error('Error updating settings:', result.error)
            return NextResponse.json({ error: result.error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, settings: result.data })

    } catch (error: any) {
        console.error('Error in PUT /api/admin/aegisx/settings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
