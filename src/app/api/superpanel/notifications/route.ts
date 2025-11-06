import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication via session token
    const sessionToken = request.cookies.get('super_admin_session')?.value
    const secretKey = process.env.SUPER_ADMIN_SECRET_KEY

    if (!sessionToken || !secretKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate session token
    try {
      const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
      if (!decoded.startsWith(secretKey)) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Fetch notifications with school information
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('super_admin_notifications')
      .select(`
        id,
        school_id,
        type,
        title,
        message,
        severity,
        is_read,
        auto_resolved,
        created_at,
        resolved_at,
        schools!inner(
          name,
          city,
          plan_type
        )
      `)
      .eq('is_read', false)
      .eq('auto_resolved', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Check for new notifications that need to be created
    await generateAutomaticNotifications(supabaseAdmin)

    return NextResponse.json({
      notifications: notifications || []
    })

  } catch (error) {
    console.error('Super admin notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication via session token
    const sessionToken = request.cookies.get('super_admin_session')?.value
    const secretKey = process.env.SUPER_ADMIN_SECRET_KEY

    if (!sessionToken || !secretKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate session token
    try {
      const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
      if (!decoded.startsWith(secretKey)) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notification_id, notification_ids } = body

    switch (action) {
      case 'mark_read':
        if (notification_id) {
          const { error: markReadError } = await supabaseAdmin
            .from('super_admin_notifications')
            .update({ is_read: true })
            .eq('id', notification_id)

          if (markReadError) {
            return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
          }
        }
        break

      case 'mark_all_read':
        const { error: markAllReadError } = await supabaseAdmin
          .from('super_admin_notifications')
          .update({ is_read: true })
          .eq('is_read', false)

        if (markAllReadError) {
          return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 })
        }
        break

      case 'resolve':
        if (notification_id) {
          const { error: resolveError } = await supabaseAdmin
            .from('super_admin_notifications')
            .update({ 
              auto_resolved: true, 
              resolved_at: new Date().toISOString() 
            })
            .eq('id', notification_id)

          if (resolveError) {
            return NextResponse.json({ error: 'Failed to resolve notification' }, { status: 500 })
          }
        }
        break

      case 'bulk_resolve':
        if (notification_ids && Array.isArray(notification_ids)) {
          const { error: bulkResolveError } = await supabaseAdmin
            .from('super_admin_notifications')
            .update({ 
              auto_resolved: true, 
              resolved_at: new Date().toISOString() 
            })
            .in('id', notification_ids)

          if (bulkResolveError) {
            return NextResponse.json({ error: 'Failed to resolve notifications' }, { status: 500 })
          }
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Super admin notification action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate automatic notifications
async function generateAutomaticNotifications(supabase: any) {
  try {
    // Get all active schools with their current usage
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select(`
        id,
        name,
        current_users,
        user_limit,
        payment_status,
        payment_due_date,
        plan_type,
        last_activity
      `)
      .eq('is_active', true)

    if (schoolsError || !schools) {
      console.error('Error fetching schools for notifications:', schoolsError)
      return
    }

    const now = new Date()
    const notifications: { school_id: string; type: string; title: string; message: string; severity: string; }[] = []

    for (const school of schools) {
      const usagePercentage = (school.current_users / school.user_limit) * 100

      // User limit warnings
      if (usagePercentage >= 100) {
        notifications.push({
          school_id: school.id,
          type: 'user_limit_exceeded',
          title: 'User Limit Exceeded',
          message: `${school.name} has exceeded their user limit (${school.current_users}/${school.user_limit} users)`,
          severity: 'critical'
        })
      } else if (usagePercentage >= 90) {
        notifications.push({
          school_id: school.id,
          type: 'user_limit_warning',
          title: 'User Limit Warning',
          message: `${school.name} is approaching their user limit (${school.current_users}/${school.user_limit} users - ${Math.round(usagePercentage)}%)`,
          severity: 'warning'
        })
      }

      // Payment due notifications
      if (school.payment_due_date) {
        const dueDate = new Date(school.payment_due_date)
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (school.payment_status === 'overdue') {
          notifications.push({
            school_id: school.id,
            type: 'payment_overdue',
            title: 'Payment Overdue',
            message: `${school.name} payment is overdue (Due: ${dueDate.toLocaleDateString()})`,
            severity: 'error'
          })
        } else if (daysUntilDue <= 7 && daysUntilDue > 0) {
          notifications.push({
            school_id: school.id,
            type: 'payment_due',
            title: 'Payment Due Soon',
            message: `${school.name} payment is due in ${daysUntilDue} day(s) (Due: ${dueDate.toLocaleDateString()})`,
            severity: 'warning'
          })
        }
      }

      // Low activity warnings
      const lastActivity = new Date(school.last_activity)
      const daysSinceActivity = Math.ceil((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceActivity >= 7) {
        notifications.push({
          school_id: school.id,
          type: 'low_activity',
          title: 'Low Activity Alert',
          message: `${school.name} has been inactive for ${daysSinceActivity} days (Last activity: ${lastActivity.toLocaleDateString()})`,
          severity: 'info'
        })
      }
    }

    // Insert new notifications (avoiding duplicates)
    if (notifications.length > 0) {
      for (const notification of notifications) {
        // Check if similar notification already exists
        const { data: existing } = await supabase
          .from('super_admin_notifications')
          .select('id')
          .eq('school_id', notification.school_id)
          .eq('type', notification.type)
          .eq('is_read', false)
          .eq('auto_resolved', false)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

        if (!existing || existing.length === 0) {
          await supabase
            .from('super_admin_notifications')
            .insert(notification)
        }
      }
    }

  } catch (error) {
    console.error('Error generating automatic notifications:', error)
  }
}
