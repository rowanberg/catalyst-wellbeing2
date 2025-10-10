import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      userId: user.id,
      fixes: [] as string[],
      issues: [] as string[],
      profile: null as any,
      classAssignments: null as any,
      moodData: null as any
    }

    // 1. Check user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    results.profile = { data: profile, error: profileError }

    if (!profile) {
      results.issues.push('No profile found for user')
      return NextResponse.json(results)
    }

    // 2. Fix class assignments if missing
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from('student_class_assignments')
      .select(`
        *,
        classes (
          id,
          class_name,
          class_code,
          subject,
          school_id
        )
      `)
      .eq('student_id', user.id)

    results.classAssignments = { data: assignments, error: assignmentError }

    if (profile.role === 'student' && (!assignments || assignments.length === 0)) {
      results.issues.push('Student has no class assignments')
      
      // Try to find and assign a class
      let classToAssign: { id: any; class_name: any; [key: string]: any } | null = null

      // Method 1: Try UUID lookup
      if (profile.class_name && profile.class_name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data: classData } = await supabaseAdmin
          .from('classes')
          .select('*')
          .eq('id', profile.class_name)
          .single()
        
        if (classData) classToAssign = classData
      }

      // Method 2: Try name lookup
      if (!classToAssign && profile.class_name && profile.class_name !== 'Class A') {
        const { data: classByName } = await supabaseAdmin
          .from('classes')
          .select('*')
          .ilike('class_name', `%${profile.class_name}%`)
          .eq('school_id', profile.school_id)
          .limit(1)
        
        if (classByName && classByName.length > 0) classToAssign = classByName[0]
      }

      // Method 3: Find any class in school
      if (!classToAssign && profile.school_id) {
        const { data: schoolClasses } = await supabaseAdmin
          .from('classes')
          .select('*')
          .eq('school_id', profile.school_id)
          .limit(1)
        
        if (schoolClasses && schoolClasses.length > 0) classToAssign = schoolClasses[0]
      }

      // Create assignment
      if (classToAssign) {
        const { data: newAssignment, error: createError } = await supabaseAdmin
          .from('student_class_assignments')
          .insert({
            student_id: user.id,
            class_id: classToAssign.id,
            is_active: true,
            assigned_at: new Date().toISOString()
          })
          .select()
          .single()

        if (!createError) {
          results.fixes.push(`Created class assignment to ${classToAssign.class_name}`)
          results.classAssignments.data = [newAssignment]
        } else {
          results.issues.push(`Failed to create class assignment: ${createError.message}`)
        }
      } else {
        results.issues.push('No suitable class found for assignment')
      }
    }

    // 3. Fix mood data if missing
    const today = new Date().toISOString().split('T')[0]
    const { data: todayMood, error: moodError } = await supabaseAdmin
      .from('mood_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    // Only include error in results if it's not the expected "no rows" error
    if (moodError && moodError.code !== 'PGRST116') {
      results.moodData = { todayMood, moodError, date: today }
    } else {
      results.moodData = { todayMood, date: today }
    }

    if (!todayMood && (!moodError || moodError?.code === 'PGRST116')) {
      const { data: newMood, error: createMoodError } = await supabaseAdmin
        .from('mood_tracking')
        .insert({
          user_id: user.id,
          date: today,
          mood_score: 7,
          energy_level: 6,
          stress_level: 4,
          notes: 'Initial mood entry',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!createMoodError) {
        results.fixes.push('Created initial mood entry for today')
        results.moodData.todayMood = newMood
      } else {
        results.issues.push(`Failed to create mood entry: ${createMoodError.message}`)
      }
    }

    // 4. Fix daily quests if missing
    const { data: todayQuests, error: questsError } = await supabaseAdmin
      .from('daily_quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)

    if (!todayQuests || todayQuests.length === 0) {
      results.issues.push('No daily quests found for today')
      
      // Create sample daily quests
      const questTypes = ['gratitude', 'kindness', 'breathing', 'water']
      const questInserts = questTypes.map(type => ({
        user_id: user.id,
        quest_type: type,
        date: today,
        completed: false,
        xp_earned: 0,
        gems_earned: 0
      }))

      const { data: newQuests, error: createQuestsError } = await supabaseAdmin
        .from('daily_quests')
        .insert(questInserts)
        .select()

      if (!createQuestsError) {
        results.fixes.push(`Created ${questTypes.length} daily quests for today`)
      } else {
        results.issues.push(`Failed to create daily quests: ${createQuestsError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${results.fixes.length} issues, found ${results.issues.length} remaining issues`,
      ...results
    })

  } catch (error: any) {
    console.error('Student data fix error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}
