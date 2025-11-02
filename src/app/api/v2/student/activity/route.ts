/**
 * ============================================================================
 * Lazy-Loaded Activity API
 * ============================================================================
 * Separated from profile for faster initial load
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    const { profileId, supabase } = auth

    // Fetch recent activity
    const { data: activity } = await supabase
      .from('student_activity')
      .select('title, activity_type, timestamp, xp_gained')
      .eq('student_id', profileId)
      .order('timestamp', { ascending: false })
      .limit(5)

    return NextResponse.json({
      recentActivity: (activity || []).map(act => ({
        title: act.title,
        type: act.activity_type,
        timestamp: act.timestamp,
        xp: act.xp_gained || null
      }))
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60'
      }
    })

  } catch (error: any) {
    console.error('❌ [Activity API] Error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
