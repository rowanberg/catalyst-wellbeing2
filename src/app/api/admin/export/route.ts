import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { schoolId, timeRange } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Fetch all relevant data
    const [usersResult, gratitudeResult, kindnessResult, courageResult, helpRequestsResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('first_name, last_name, role, created_at, current_streak, total_xp, level')
        .eq('school_id', schoolId),
      
      supabaseAdmin
        .from('gratitude_entries')
        .select('created_at, entry_text')
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString()),
      
      supabaseAdmin
        .from('kindness_counter')
        .select('created_at, act_description')
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString()),
      
      supabaseAdmin
        .from('courage_log')
        .select('created_at, courage_description')
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString()),
      
      supabaseAdmin
        .from('help_requests')
        .select('created_at, urgency_level, status, request_type')
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
    ])

    // Create CSV content
    let csvContent = 'Type,Date,User Role,Description,Additional Info\n'

    // Add users data
    if (usersResult.data) {
      usersResult.data.forEach(user => {
        csvContent += `User,${user.created_at},${user.role},"${user.first_name} ${user.last_name}","XP: ${user.total_xp || 0}, Level: ${user.level || 1}, Streak: ${user.current_streak || 0}"\n`
      })
    }

    // Add gratitude entries
    if (gratitudeResult.data) {
      gratitudeResult.data.forEach(entry => {
        csvContent += `Gratitude,${entry.created_at},Student,"${entry.entry_text?.replace(/"/g, '""') || 'N/A'}",""\n`
      })
    }

    // Add kindness acts
    if (kindnessResult.data) {
      kindnessResult.data.forEach(act => {
        csvContent += `Kindness,${act.created_at},Student,"${act.act_description?.replace(/"/g, '""') || 'N/A'}",""\n`
      })
    }

    // Add courage entries
    if (courageResult.data) {
      courageResult.data.forEach(entry => {
        csvContent += `Courage,${entry.created_at},Student,"${entry.courage_description?.replace(/"/g, '""') || 'N/A'}",""\n`
      })
    }

    // Add help requests
    if (helpRequestsResult.data) {
      helpRequestsResult.data.forEach(request => {
        csvContent += `Help Request,${request.created_at},Student,"${request.request_type || 'General'}","Urgency: ${request.urgency_level}, Status: ${request.status}"\n`
      })
    }

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="school-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
