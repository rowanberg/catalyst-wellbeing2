import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for super admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UserStats {
  role: string
  count: number
  activeToday: number
}

interface TopStudent {
  id: string
  first_name: string
  last_name: string
  xp: number
  gems: number
  level: number
  avatar_url?: string
}

interface SchoolAnalytics {
  totalXP: number
  totalGems: number
  averageLevel: number
  activeUsersToday: number
  activeUsersThisWeek: number
  activeUsersThisMonth: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params promise (Next.js 15 requirement)
    const resolvedParams = await params
    const schoolId = resolvedParams.id

    // Check super admin access
    const accessKey = request.cookies.get('super_admin_key')?.value
    if (!accessKey || accessKey !== '4C4F52454D5F495053554D5F444F4C4F525F534954') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch school details
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Fetch all users for this school with role breakdown
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    // Process user statistics by role
    const userStats: UserStats[] = []
    const roles = ['student', 'teacher', 'parent', 'admin']
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const role of roles) {
      const roleUsers = users?.filter(u => u.role === role) || []
      const activeToday = roleUsers.filter(u => {
        const lastActive = new Date(u.updated_at || u.created_at)
        return lastActive >= today
      }).length

      userStats.push({
        role,
        count: roleUsers.length,
        activeToday
      })
    }

    // Get top performing students (by XP and gems)
    const students = users?.filter(u => u.role === 'student') || []
    const topStudents: TopStudent[] = students
      .sort((a, b) => {
        // Sort by XP first, then by gems
        if (b.xp !== a.xp) return b.xp - a.xp
        return b.gems - a.gems
      })
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        xp: s.xp || 0,
        gems: s.gems || 0,
        level: s.level || 1,
        avatar_url: s.avatar_url
      }))

    // Calculate school analytics
    const analytics: SchoolAnalytics = {
      totalXP: students.reduce((sum, s) => sum + (s.xp || 0), 0),
      totalGems: students.reduce((sum, s) => sum + (s.gems || 0), 0),
      averageLevel: students.length > 0 
        ? Math.round(students.reduce((sum, s) => sum + (s.level || 1), 0) / students.length)
        : 1,
      activeUsersToday: userStats.reduce((sum, stat) => sum + stat.activeToday, 0),
      activeUsersThisWeek: 0, // Will be calculated below
      activeUsersThisMonth: 0 // Will be calculated below
    }

    // Calculate weekly and monthly active users
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    analytics.activeUsersThisWeek = (users || []).filter(u => {
      const lastActive = new Date(u.updated_at || u.created_at)
      return lastActive >= oneWeekAgo
    }).length

    analytics.activeUsersThisMonth = (users || []).filter(u => {
      const lastActive = new Date(u.updated_at || u.created_at)
      return lastActive >= oneMonthAgo
    }).length

    // Fetch recent help requests
    const { data: helpRequests, error: helpError } = await supabaseAdmin
      .from('help_requests')
      .select('id, message, urgency, status, created_at, student_id')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch recent activities (simplified - you can expand this)
    const recentActivities = []
    
    // Add help requests as activities
    if (helpRequests) {
      for (const request of helpRequests) {
        const student = users?.find(u => u.user_id === request.student_id)
        recentActivities.push({
          type: 'help_request',
          message: `${student?.first_name || 'Student'} ${student?.last_name || ''} submitted a ${request.urgency} priority help request`,
          status: request.status,
          timestamp: request.created_at
        })
      }
    }

    // Get teacher-student ratio
    const teacherCount = userStats.find(s => s.role === 'teacher')?.count || 0
    const studentCount = userStats.find(s => s.role === 'student')?.count || 0
    const teacherStudentRatio = teacherCount > 0 
      ? `1:${Math.round(studentCount / teacherCount)}`
      : 'N/A'

    // Get parent engagement (parents linked to students)
    const { data: parentRelations, error: parentError } = await supabaseAdmin
      .from('parent_child_relationships')
      .select('parent_id, child_id')
      .in('child_id', students.map(s => s.id))

    const parentEngagement = {
      totalParents: userStats.find(s => s.role === 'parent')?.count || 0,
      linkedParents: new Set(parentRelations?.map(r => r.parent_id) || []).size,
      engagementRate: 0
    }
    
    if (studentCount > 0) {
      parentEngagement.engagementRate = Math.round((parentEngagement.linkedParents / studentCount) * 100)
    }

    // Fetch payment transactions
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
    }

    // Fetch subscription plan details
    let subscriptionPlan = null
    if (school.plan_type) {
      const { data: plan } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('name', school.plan_type)
        .single()
      
      subscriptionPlan = plan
    }

    // Fetch wallet data for students
    const studentIds = users?.filter(u => u.role === 'student').map(u => u.id) || []
    let walletData = []
    if (studentIds.length > 0) {
      const { data: wallets } = await supabaseAdmin
        .from('student_wallets')
        .select('*')
        .in('student_id', studentIds)
      
      walletData = wallets || []
    }

    // Calculate wallet analytics
    const walletAnalytics = {
      totalStudentsWithWallets: walletData.length,
      totalMindGems: walletData.reduce((sum, w) => sum + (w.mind_gems_balance || 0), 0),
      totalFluxon: walletData.reduce((sum, w) => sum + Number(w.fluxon_balance || 0), 0),
      averageMindGems: walletData.length > 0 ? Math.round(walletData.reduce((sum, w) => sum + (w.mind_gems_balance || 0), 0) / walletData.length) : 0,
      averageFluxon: walletData.length > 0 ? (walletData.reduce((sum, w) => sum + Number(w.fluxon_balance || 0), 0) / walletData.length).toFixed(2) : 0,
      activeWallets: walletData.filter(w => w.is_active).length,
      lockedWallets: walletData.filter(w => w.is_locked).length
    }

    // Get student tags
    const studentsWithTags = users?.filter(u => u.role === 'student').map(u => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`,
      student_tag: u.student_tag || 'Not assigned',
      wallet_address: walletData.find(w => w.student_id === u.id)?.wallet_address || null,
      mind_gems: walletData.find(w => w.student_id === u.id)?.mind_gems_balance || 0,
      fluxon: walletData.find(w => w.student_id === u.id)?.fluxon_balance || 0
    })) || []

    // Calculate payment analytics
    const completedPayments = payments?.filter(p => p.status === 'completed') || []
    const paymentAnalytics = {
      totalRevenue: payments?.reduce((sum, p) => p.status === 'completed' ? sum + Number(p.amount) : sum, 0) || 0,
      pendingAmount: payments?.reduce((sum, p) => p.status === 'pending' ? sum + Number(p.amount) : sum, 0) || 0,
      lastPaymentAmount: payments?.find(p => p.status === 'completed')?.amount || 0,
      paymentHistory: payments?.length || 0,
      averagePayment: completedPayments.length > 0
        ? (completedPayments.reduce((sum, p) => sum + Number(p.amount), 0) / completedPayments.length)
        : 0
    }

    // Compile comprehensive response
    const response = {
      school: {
        ...school,
        userStats,
        totalUsers: users?.length || 0,
        teacherStudentRatio
      },
      topStudents,
      analytics,
      parentEngagement,
      recentActivities: recentActivities.slice(0, 10),
      allUsers: users?.map(u => ({
        id: u.id,
        user_id: u.user_id,
        name: `${u.first_name} ${u.last_name}`,
        role: u.role,
        email: u.email || 'N/A',
        xp: u.xp || 0,
        gems: u.gems || 0,
        level: u.level || 1,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
        last_active: u.updated_at || u.created_at,
        student_tag: u.student_tag || null
      })) || [],
      payments: {
        transactions: payments || [],
        analytics: paymentAnalytics,
        subscriptionPlan
      },
      controls: {
        walletAnalytics,
        studentsWithTags,
        userLimits: {
          current: {
            students: userStats.find(s => s.role === 'student')?.count || 0,
            teachers: userStats.find(s => s.role === 'teacher')?.count || 0,
            parents: userStats.find(s => s.role === 'parent')?.count || 0,
            total: users?.length || 0
          },
          maximum: {
            total: school.user_limit || 100,
            students: Math.floor((school.user_limit || 100) * 0.7), // 70% students
            teachers: Math.floor((school.user_limit || 100) * 0.1), // 10% teachers
            parents: Math.floor((school.user_limit || 100) * 0.2)  // 20% parents
          }
        },
        schoolSettings: {
          is_active: school.is_active,
          payment_status: school.payment_status,
          plan_type: school.plan_type,
          created_at: school.created_at,
          last_activity: school.last_activity
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('School details error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
