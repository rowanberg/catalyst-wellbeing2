import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize milestones for user if not exists (with error handling)
    try {
      await supabase.rpc('initialize_student_achievements', { p_student_id: user.id })
    } catch (initError) {
      console.log('Milestone initialization skipped (tables may not exist yet):', initError)
    }

    // Get milestone templates with student progress
    const { data: milestones, error } = await supabase
      .from('milestone_templates')
      .select(`
        *,
        student_milestones!left(
          current_value,
          is_completed,
          completed_at
        )
      `)
      .eq('student_milestones.student_id', user.id)
      .eq('is_active', true)
      .order('target_value', { ascending: true })

    if (error) {
      console.error('Error fetching milestones:', error)
      return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 })
    }

    // Get current student data for milestone updates
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, gems, level, streak_days, quests_completed, pet_happiness')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      // Update milestone progress for various data sources
      const updates = [
        { data_source: 'total_xp', value: profile.xp || 0 },
        { data_source: 'total_gems', value: profile.gems || 0 },
        { data_source: 'current_level', value: profile.level || 1 },
        { data_source: 'streak_days', value: profile.streak_days || 0 },
        { data_source: 'quests_completed', value: profile.quests_completed || 0 },
        { data_source: 'pet_happiness', value: profile.pet_happiness || 0 }
      ]

      for (const update of updates) {
        await supabase.rpc('update_milestone_progress', {
          p_student_id: user.id,
          p_data_source: update.data_source,
          p_new_value: update.value
        })
      }
    }

    // Process milestones to match frontend interface
    const processedMilestones = milestones?.map((milestone: any) => {
      const studentProgress = milestone.student_milestones?.[0] || null
      
      return {
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        targetValue: milestone.target_value,
        currentValue: studentProgress?.current_value || 0,
        category: milestone.category,
        icon: milestone.icon,
        color: milestone.color,
        rewards: milestone.rewards || { xp: 0, gems: 0 },
        isCompleted: studentProgress?.is_completed || false,
        completedAt: studentProgress?.completed_at || null
      }
    }) || []

    return NextResponse.json({ milestones: processedMilestones })
  } catch (error) {
    console.error('Milestones API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
