import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
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

        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Get user profile to verify admin role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, school_id')
            .eq('user_id', user.id)
            .single()

        if (profileError || !profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const {
            announcement_id,
            school_id,
            target_audience,
            title,
            message
        } = await request.json()

        // Validate required fields
        if (!school_id || !title || !message) {
            return NextResponse.json({ error: 'School ID, title, and message are required' }, { status: 400 })
        }

        // Verify school_id matches admin's school
        if (school_id !== profile.school_id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Build query to get target users based on audience
        let query = supabaseAdmin
            .from('profiles')
            .select('user_id, first_name, last_name')
            .eq('school_id', school_id)

        // Filter by audience
        if (target_audience && target_audience !== 'all') {
            query = query.eq('role', target_audience === 'students' ? 'student' : target_audience.slice(0, -1)) // Remove 's' for role match
        } else {
            // Default to students only if 'all' is specified
            query = query.eq('role', 'student')
        }

        const { data: targetUsers, error: usersError } = await query

        if (usersError) {
            console.error('Error fetching target users:', usersError)
            return NextResponse.json({ error: 'Failed to fetch target users' }, { status: 500 })
        }

        if (!targetUsers || targetUsers.length === 0) {
            return NextResponse.json({
                success: true,
                notifications_sent: 0,
                message: 'No users found for the specified audience'
            })
        }

        // Create notification records for each user
        const notifications = targetUsers.map(targetUser => ({
            user_id: targetUser.user_id,
            title: title,
            message: message,
            type: 'announcement',
            announcement_id: announcement_id || null,
            school_id: school_id,
            is_read: false,
            created_at: new Date().toISOString()
        }))

        // Insert notifications in batches to avoid overwhelming the database
        const batchSize = 100
        let totalInserted = 0

        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize)

            const { error: insertError } = await supabaseAdmin
                .from('notifications')
                .insert(batch)

            if (insertError) {
                console.error('Error inserting notifications batch:', insertError)
                // Continue with next batch even if one fails
            } else {
                totalInserted += batch.length
            }
        }

        console.log(`✅ [NOTIFICATIONS] Sent ${totalInserted} notifications for announcement: ${title}`)

        return NextResponse.json({
            success: true,
            notifications_sent: totalInserted
        })

    } catch (error) {
        console.error('Send notifications error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
