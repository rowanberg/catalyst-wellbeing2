import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role and school
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const active = searchParams.get('active')

    // Build query
    let query = supabase
      .from('quests')
      .select(`
        *,
        quest_attempts(
          id,
          student_id,
          status,
          completed_at,
          time_spent
        )
      `)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty)
    }
    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }

    const { data: quests, error } = await query

    if (error) {
      console.error('Error fetching quests:', error)
      return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 })
    }

    // Process quests to add analytics
    const processedQuests = quests?.map((quest: any) => {
      const attempts = quest.quest_attempts || []
      const completedAttempts = attempts.filter((a: any) => a.status === 'completed')
      
      return {
        ...quest,
        completedBy: completedAttempts.map((a: any) => a.student_id),
        totalAttempts: attempts.length,
        successRate: attempts.length > 0 ? Math.round((completedAttempts.length / attempts.length) * 100) : 0,
        averageCompletionTime: completedAttempts.length > 0 
          ? Math.round(completedAttempts.reduce((sum: number, a: any) => sum + (a.time_spent || 0), 0) / completedAttempts.length)
          : 0,
        quest_attempts: undefined // Remove from response
      }
    })

    return NextResponse.json({ quests: processedQuests })
  } catch (error) {
    console.error('Error in GET /api/teacher/quests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Prepare quest data
    const questData = {
      school_id: profile.school_id,
      teacher_id: user.id,
      title: body.title,
      description: body.description,
      category: body.category || 'academic',
      difficulty: body.difficulty || 'easy',
      xp_reward: Math.max(1, parseInt(body.xpReward) || 10),
      gem_reward: Math.max(1, parseInt(body.gemReward) || 5),
      requirements: body.requirements || [],
      time_limit: body.timeLimit ? parseInt(body.timeLimit) : null,
      is_active: body.isActive !== false,
      tags: body.tags || [],
      prerequisites: body.prerequisites || [],
      auto_assign: body.autoAssign || false,
      target_students: body.targetStudents || [],
      due_date: body.dueDate ? new Date(body.dueDate).toISOString() : null,
      repeat_type: body.repeatType || 'none',
      points: body.points || {
        creativity: 0,
        collaboration: 0,
        critical_thinking: 0,
        communication: 0
      },
      is_template: body.isTemplate || false,
      template_category: body.templateCategory || null
    }

    const { data: quest, error } = await supabase
      .from('quests')
      .insert(questData)
      .select()
      .single()

    if (error) {
      console.error('Error creating quest:', error)
      return NextResponse.json({ error: 'Failed to create quest' }, { status: 500 })
    }

    // If auto-assign is enabled, create quest attempts for target students
    if (quest.auto_assign && quest.target_students?.length > 0) {
      const attempts = quest.target_students.map((studentId: string) => ({
        quest_id: quest.id,
        student_id: studentId,
        status: 'in_progress'
      }))

      await supabase.from('quest_attempts').insert(attempts)
    }

    return NextResponse.json({ quest }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/teacher/quests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
