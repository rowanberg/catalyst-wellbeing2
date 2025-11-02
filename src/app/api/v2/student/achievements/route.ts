/**
 * ============================================================================
 * Lazy-Loaded Achievements API
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

    // Fetch achievements
    const { data: achievements } = await supabase
      .from('student_achievements')
      .select('id, achievement_name, icon, xp_reward, earned_at')
      .eq('student_id', profileId)
      .order('earned_at', { ascending: false })
      .limit(8)

    return NextResponse.json({
      achievements: (achievements || []).map(ach => ({
        id: ach.id,
        name: ach.achievement_name,
        icon: ach.icon || '🏆',
        xp: ach.xp_reward || 10,
        earnedAt: ach.earned_at
      }))
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300'
      }
    })

  } catch (error: any) {
    console.error('❌ [Achievements API] Error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
