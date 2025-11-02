import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for super admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface School {
  id: string
  name: string
  city?: string
  country?: string
  logo_url?: string
  plan_type: 'free' | 'basic' | 'premium'
  current_users: number
  user_limit: number
  payment_status: 'active' | 'overdue' | 'suspended' | 'cancelled'
  payment_due_date?: string
  last_payment_date?: string
  monthly_fee: number
  created_at: string
  last_activity: string
  is_active: boolean
}

export async function GET(request: NextRequest) {
  try {
    // Verify super admin session (secure server-side check)
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

    // Log access
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log access attempt
    try {
      await supabaseAdmin
        .from('super_admin_logs')
        .insert({
          admin_id: 'super-admin',
          action: 'dashboard_access',
          ip_address: ip,
          user_agent: userAgent,
          details: { timestamp: new Date().toISOString() }
        })
    } catch (logError) {
      console.warn('Failed to log access:', logError)
    }

    // Fetch schools with enhanced data
    const { data: schools, error: schoolsError } = await supabaseAdmin
      .from('schools')
      .select(`
        id,
        name,
        address,
        phone,
        email,
        school_code,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Get user counts for each school
    const { data: userCounts, error: userCountsError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role')
      .not('school_id', 'is', null)

    if (schoolsError) {
      console.error('Error fetching schools:', schoolsError)
      return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 })
    }

    // Process schools data with real information
    const processedSchools = (schools || []).map((school: any) => {
      const schoolUsers = userCounts?.filter((u: any) => u.school_id === school.id) || []
      const currentUsers = schoolUsers.length
      
      // Extract city from address (simple approach)
      const city = school.address ? school.address.split(',')[0]?.trim() : 'Unknown'
      
      return {
        id: school.id,
        name: school.name,
        city: city,
        country: 'India',
        logo_url: undefined,
        plan_type: 'free' as const, // Default to free, can be enhanced
        current_users: currentUsers,
        user_limit: 100, // Default limit
        payment_status: 'active' as const,
        payment_due_date: undefined,
        last_payment_date: undefined,
        monthly_fee: 0,
        created_at: school.created_at,
        last_activity: school.updated_at || school.created_at,
        is_active: true
      }
    })

    // Calculate dashboard statistics
    const totalSchools = processedSchools.length
    const activeSchoolsToday = processedSchools.filter((school: any) => {
      const lastActivity = new Date(school.last_activity)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return lastActivity >= today
    }).length

    const totalUsers = processedSchools.reduce((sum: number, school: any) => sum + school.current_users, 0)
    const monthlyRevenue = processedSchools.reduce((sum: number, school: any) => {
      return sum + (school.payment_status === 'active' ? school.monthly_fee : 0)
    }, 0)

    const overduePayments = processedSchools.filter((school: any) => 
      school.payment_status === 'overdue'
    ).length

    const userLimitWarnings = processedSchools.filter((school: any) => {
      const usagePercentage = (school.current_users / school.user_limit) * 100
      return usagePercentage >= 80
    }).length

    // Skip analytics for now - will be enhanced later
    // const thirtyDaysAgo = new Date()
    // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const stats = {
      total_schools: totalSchools,
      active_schools_today: activeSchoolsToday,
      total_users: totalUsers,
      monthly_revenue: monthlyRevenue,
      overdue_payments: overduePayments,
      user_limit_warnings: userLimitWarnings
    }

    return NextResponse.json({
      schools: processedSchools,
      stats,
      analytics: [] // Will be enhanced later
    })

  } catch (error) {
    console.error('Super admin dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify super admin session (secure server-side check)
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
    const { action, school_id, data } = body

    // Log the action
    try {
      await supabaseAdmin
        .from('super_admin_logs')
        .insert({
          admin_id: 'super-admin',
          action,
          target_school_id: school_id,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          details: data
        })
    } catch (logError) {
      console.warn('Failed to log action:', logError)
    }

    switch (action) {
      case 'update_school_plan':
        const { plan_type, user_limit, monthly_fee } = data
        const { error: updateError } = await supabaseAdmin
          .from('schools')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', school_id)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update school plan' }, { status: 500 })
        }
        break

      case 'suspend_school':
        const { error: suspendError } = await supabaseAdmin
          .from('schools')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', school_id)

        if (suspendError) {
          return NextResponse.json({ error: 'Failed to suspend school' }, { status: 500 })
        }
        break

      case 'reactivate_school':
        const { error: reactivateError } = await supabaseAdmin
          .from('schools')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', school_id)

        if (reactivateError) {
          return NextResponse.json({ error: 'Failed to reactivate school' }, { status: 500 })
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Super admin action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
