import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    // Get students in teacher's school with well-being data
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        grade_level,
        current_mood,
        streak_days,
        total_quests_completed,
        xp,
        level,
        last_active,
        mood_tracking (
          mood,
          created_at
        )
      `)
      .eq('role', 'student')
      .eq('school_id', profile.school_id)
      .order('first_name')

    if (studentsError) {
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    // Get unread message counts for each student
    const studentIds = students?.map((s: any) => s.id) || []
    const { data: messageCounts } = await supabase
      .from('secure_messages')
      .select('sender_id')
      .in('sender_id', studentIds)
      .eq('is_read', false)

    // Calculate unread counts per student
    const unreadCounts = messageCounts?.reduce((acc: Record<string, number>, msg: any) => {
      acc[msg.sender_id] = (acc[msg.sender_id] || 0) + 1
      return acc
    }, {}) || {}

    // Get well-being analytics
    const wellbeingStats = {
      totalStudents: students?.length || 0,
      thriving: 0,
      needsSupport: 0,
      atRisk: 0,
      averageMoodScore: 0,
      trendingUp: true
    }

    // Calculate well-being status for each student
    const studentsWithWellbeing = students?.map((student: any) => {
      // Determine well-being status based on mood, activity, and streaks
      let wellbeingStatus = 'thriving'
      const daysSinceActive = student.last_active ? 
        Math.floor((Date.now() - new Date(student.last_active).getTime()) / (1000 * 60 * 60 * 24)) : 0
      
      if (daysSinceActive > 3 || (student.streak_days || 0) < 2) {
        wellbeingStatus = 'at_risk'
        wellbeingStats.atRisk++
      } else if (daysSinceActive > 1 || (student.streak_days || 0) < 5) {
        wellbeingStatus = 'needs_support'
        wellbeingStats.needsSupport++
      } else {
        wellbeingStats.thriving++
      }

      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        grade: student.grade_level || '8th Grade',
        avatar: `/avatars/student${student.id.slice(-1)}.jpg`,
        isOnline: daysSinceActive === 0,
        lastMessage: 'Ready for office hours!',
        unreadCount: unreadCounts[student.id] || 0,
        xp: student.xp || 0,
        level: student.level || 1,
        mood: student.current_mood || 'neutral',
        wellbeingStatus,
        lastActive: daysSinceActive === 0 ? 'Now' : 
                   daysSinceActive === 1 ? '1 day ago' : 
                   `${daysSinceActive} days ago`,
        streakDays: student.streak_days || 0,
        questsCompleted: student.total_quests_completed || 0
      }
    }) || []

    // Calculate average mood score
    const moodScores = studentsWithWellbeing.map((s: any) => {
      switch (s.mood) {
        case 'happy': return 9
        case 'excited': return 8
        case 'calm': return 7
        case 'neutral': return 6
        case 'sad': return 4
        case 'anxious': return 3
        default: return 6
      }
    })
    wellbeingStats.averageMoodScore = moodScores.length > 0 ? 
      Math.round((moodScores.reduce((a: number, b: number) => a + b, 0) / moodScores.length) * 10) / 10 : 0

    // Get intervention suggestions based on class analytics
    const interventionSuggestions = [
      {
        id: '1',
        title: '3-Minute Breathing Break',
        description: 'Guide the class through a calming breathing exercise',
        type: 'breathing',
        duration: '3 minutes',
        difficulty: 'easy'
      },
      {
        id: '2',
        title: 'Gratitude Circle',
        description: 'Have students share one thing they\'re grateful for',
        type: 'social',
        duration: '10 minutes',
        difficulty: 'easy'
      },
      {
        id: '3',
        title: 'Mindful Movement',
        description: 'Simple stretches and movement to re-energize',
        type: 'movement',
        duration: '5 minutes',
        difficulty: 'medium'
      }
    ]

    // Add more targeted suggestions based on well-being data
    if (wellbeingStats.atRisk > 0) {
      interventionSuggestions.unshift({
        id: '4',
        title: 'Check-in Circle',
        description: 'Create a safe space for students to share how they\'re feeling',
        type: 'social',
        duration: '15 minutes',
        difficulty: 'medium'
      })
    }

    return NextResponse.json({
      students: studentsWithWellbeing,
      wellbeingAnalytics: wellbeingStats,
      interventionSuggestions,
      officeHours: {
        isActive: true,
        endsAt: '4:00 PM',
        nextSession: 'Tomorrow 2:00 PM'
      }
    })

  } catch (error) {
    console.error('Teacher messaging API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
