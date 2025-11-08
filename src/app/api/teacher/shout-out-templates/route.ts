import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Predefined shout-out templates
const shoutOutTemplates = [
  {
    id: 'academic-excellence-1',
    category: 'academic',
    title: 'Academic Excellence',
    message: 'showed outstanding academic performance and dedication to learning!',
    badge: '🏆',
    icon: '📚'
  },
  {
    id: 'helpful-classmate-1',
    category: 'kindness',
    title: 'Helpful Classmate',
    message: 'went out of their way to help a classmate and showed true kindness!',
    badge: '💝',
    icon: '🤝'
  },
  {
    id: 'great-effort-1',
    category: 'effort',
    title: 'Amazing Effort',
    message: 'put in incredible effort and never gave up, even when things got challenging!',
    badge: '💪',
    icon: '🎯'
  },
  {
    id: 'positive-behavior-1',
    category: 'behavior',
    title: 'Positive Role Model',
    message: 'demonstrated excellent behavior and set a great example for others!',
    badge: '⭐',
    icon: '👑'
  },
  {
    id: 'creative-thinking-1',
    category: 'creativity',
    title: 'Creative Genius',
    message: 'showed amazing creativity and brought fresh, innovative ideas to class!',
    badge: '🎨',
    icon: '💡'
  },
  {
    id: 'leadership-skills-1',
    category: 'leadership',
    title: 'Natural Leader',
    message: 'stepped up as a leader and helped guide their team to success!',
    badge: '👑',
    icon: '🌟'
  },
  {
    id: 'improvement-1',
    category: 'effort',
    title: 'Great Improvement',
    message: 'has shown remarkable improvement and growth - keep up the fantastic work!',
    badge: '📈',
    icon: '🚀'
  },
  {
    id: 'participation-1',
    category: 'behavior',
    title: 'Active Participant',
    message: 'actively participated in class discussions and contributed valuable insights!',
    badge: '🗣️',
    icon: '🙋'
  },
  {
    id: 'problem-solver-1',
    category: 'academic',
    title: 'Problem Solver',
    message: 'tackled challenging problems with determination and found creative solutions!',
    badge: '🧩',
    icon: '🔍'
  },
  {
    id: 'team-player-1',
    category: 'kindness',
    title: 'Amazing Team Player',
    message: 'worked wonderfully with others and made everyone feel included!',
    badge: '🤝',
    icon: '👥'
  },
  {
    id: 'curiosity-1',
    category: 'academic',
    title: 'Curious Learner',
    message: 'asked thoughtful questions and showed genuine curiosity about learning!',
    badge: '🤔',
    icon: '❓'
  },
  {
    id: 'perseverance-1',
    category: 'effort',
    title: 'Never Give Up',
    message: 'showed incredible perseverance and kept trying until they succeeded!',
    badge: '🔥',
    icon: '💯'
  }
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Return predefined templates
    // In a real application, these could be customized per school
    return NextResponse.json({ templates: shoutOutTemplates })

  } catch (error: any) {
    console.error('Unexpected error in shout-out templates API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
