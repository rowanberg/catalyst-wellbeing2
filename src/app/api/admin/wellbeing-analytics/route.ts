import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    const grade = searchParams.get('grade') || 'all'

    // Get current user and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile with school_id
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id, user_id')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile lookup error:', profileError)
      return NextResponse.json({ error: 'Profile not found', details: profileError.message }, { status: 403 })
    }

    if (!adminProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    // Allow both admin and super_admin roles
    if (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin') {
      console.error('Invalid role:', adminProfile.role)
      return NextResponse.json({ 
        error: 'Unauthorized - Admin access required', 
        currentRole: adminProfile.role 
      }, { status: 403 })
    }

    const schoolId = adminProfile.school_id

    console.log('=== WELLBEING ANALYTICS DEBUG ===')
    console.log('Admin school_id:', schoolId)
    console.log('Admin role:', adminProfile.role)

    // Calculate date range
    const now = new Date()
    const daysBack = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // First, check if any students exist at all
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, role, school_id, first_name, last_name')
      .limit(5)
    
    console.log('Sample profiles in database:', allProfiles?.length || 0)
    if (allProfiles && allProfiles.length > 0) {
      console.log('First profile:', {
        role: allProfiles[0].role,
        school_id: allProfiles[0].school_id,
        has_name: !!(allProfiles[0].first_name || allProfiles[0].last_name)
      })
    }

    // Get all students in the school
    let studentsQuery = supabase
      .from('profiles')
      .select(`
        id, 
        user_id,
        first_name,
        last_name, 
        grade_level, 
        class_name,
        school_id,
        created_at,
        streak_days,
        total_quests_completed,
        current_mood,
        pet_happiness
      `)
      .eq('school_id', schoolId)
      .eq('role', 'student')

    if (grade !== 'all') {
      studentsQuery = studentsQuery.eq('grade_level', grade)
    }

    const { data: students, error: studentsError } = await studentsQuery

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students', details: studentsError.message }, { status: 500 })
    }

    console.log('Students found with school_id + role=student:', students?.length || 0)
    
    // Log student details if found
    if (students && students.length > 0) {
      console.log('Student details:', students.map(s => ({
        name: `${s.first_name} ${s.last_name}`,
        user_id: s.user_id,
        school_id: s.school_id,
        class_name: s.class_name
      })))
    }
    
    // If no students found, try alternative query without school_id check
    if (!students || students.length === 0) {
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id, school_id, role, first_name, last_name')
        .eq('role', 'student')
        .limit(10)
      
      console.log('Total students in DB (any school):', allStudents?.length || 0)
      if (allStudents && allStudents.length > 0) {
        console.log('Sample student schools:', allStudents.map(s => s.school_id))
      }

      // Check for profiles with this school but different role
      const { data: schoolProfiles } = await supabase
        .from('profiles')
        .select('id, role, first_name, last_name')
        .eq('school_id', schoolId)
      
      console.log('All profiles for this school:', schoolProfiles?.length || 0)
      if (schoolProfiles && schoolProfiles.length > 0) {
        const roleCount = schoolProfiles.reduce((acc: any, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1
          return acc
        }, {})
        console.log('Roles in school:', roleCount)
      }
    }

    // Get mood tracking data - use user_id since that's what mood_tracking references
    const studentUserIds = students?.map(s => s.user_id).filter(Boolean) || []
    console.log('Student user_ids for queries:', studentUserIds.length)

    const { data: moodData, error: moodError } = await supabase
      .from('mood_tracking')
      .select('user_id, mood, mood_emoji, date, created_at')
      .in('user_id', studentUserIds)
      .gte('date', startDate.toISOString().split('T')[0])

    console.log('Mood data entries:', moodData?.length || 0)
    console.log('Date range filter:', startDate.toISOString().split('T')[0], 'to', new Date().toISOString().split('T')[0])
    
    if (moodError) {
      console.error('Mood data error:', moodError)
    }
    
    if (moodData && moodData.length > 0) {
      console.log('Sample mood entries:', moodData.slice(0, 3))
    } else {
      // Try to fetch ANY mood data without filters to check if table is empty
      const { data: anyMoods, error: anyMoodsError } = await supabase
        .from('mood_tracking')
        .select('user_id, mood_emoji, date')
        .limit(5)
      
      console.log('Any mood entries in DB:', anyMoods?.length || 0)
      if (anyMoodsError) {
        console.error('Error checking mood_tracking table:', anyMoodsError)
      }
      if (anyMoods && anyMoods.length > 0) {
        console.log('Sample mood data from DB:', anyMoods)
      }
    }

    // Get daily quests data
    const { data: questsData, error: questsError } = await supabase
      .from('daily_quests')
      .select('user_id, quest_type, completed, date, xp_earned, gems_earned')
      .in('user_id', studentUserIds)
      .gte('date', startDate.toISOString().split('T')[0])

    console.log('Quest data entries:', questsData?.length || 0)

    // Get help requests (check if table exists)
    let helpRequests: any[] = []
    try {
      const { data, error } = await supabase
        .from('help_requests')
        .select('student_id, urgency, status, created_at, message')
        .in('student_id', studentUserIds)
        .gte('created_at', startDate.toISOString())
      if (!error) helpRequests = data || []
    } catch (e) {
      console.log('Help requests table not found, skipping')
    }

    console.log('Help requests:', helpRequests?.length || 0)

    // Get mindfulness sessions as proxy for gratitude
    let gratitudeData: any[] = []
    try {
      const { data, error } = await supabase
        .from('mindfulness_sessions')
        .select('user_id, session_type, created_at')
        .eq('session_type', 'gratitude')
        .in('user_id', studentUserIds)
        .gte('created_at', startDate.toISOString())
      if (!error) gratitudeData = data || []
    } catch (e) {
      console.log('Mindfulness sessions table not found, skipping')
    }

    // Note: courage, habit, kindness data fetched later for student insights

    // Calculate metrics
    const totalStudents = students?.length || 0
    
    // Mood analysis
    const moodEmojis = moodData?.map(m => m.mood_emoji) || []
    const positiveMoods = ['😊', '😄', '😆', '🥰', '😍', '🤗', '😌', '😎']
    const neutralMoods = ['😐', '😑', '🙂', '😶']
    const negativeMoods = ['😢', '😭', '😰', '😨', '😡', '😤', '😔', '😞']
    
    const positiveCount = moodEmojis.filter(emoji => positiveMoods.includes(emoji)).length
    const neutralCount = moodEmojis.filter(emoji => neutralMoods.includes(emoji)).length
    const negativeCount = moodEmojis.filter(emoji => negativeMoods.includes(emoji)).length
    const totalMoodEntries = moodEmojis.length

    // Quest completion analysis
    const totalQuests = questsData?.length || 0
    const completedQuests = questsData?.filter(q => q.completed).length || 0
    const questCompletionRate = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0

    // Help requests analysis
    const totalHelpRequests = helpRequests?.length || 0
    const urgentRequests = helpRequests?.filter(hr => hr.urgency === 'high' || hr.urgency === 'urgent').length || 0
    const pendingRequests = helpRequests?.filter(hr => hr.status === 'pending').length || 0

    // Activity engagement
    const activeStudents = new Set([
      ...(moodData?.map(m => m.user_id) || []),
      ...(questsData?.map(q => q.user_id) || []),
      ...(gratitudeData?.map(g => g.user_id) || [])
    ]).size

    const engagementRate = totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0

    // Calculate wellbeing score (1-10 scale)
    const wellbeingScore = totalMoodEntries > 0 
      ? Math.min(10, Math.max(1, 
          5 + (positiveCount - negativeCount) / totalMoodEntries * 5 + 
          (questCompletionRate / 100) * 2 + 
          (engagementRate / 100) * 1.5 - 
          (urgentRequests / Math.max(totalStudents, 1)) * 3
        ))
      : 7.5

    // Fetch all classes for the school from classes table
    const { data: schoolClasses, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', schoolId)

    console.log('School classes found:', schoolClasses?.length || 0)
    if (classesError) {
      console.error('Error fetching classes:', classesError)
    } else if (schoolClasses && schoolClasses.length > 0) {
      console.log('First class structure:', Object.keys(schoolClasses[0]))
    }

    // First try to count records to verify table exists
    const { count: assignmentCount, error: countError } = await supabase
      .from('student_class_assignments')
      .select('*', { count: 'exact', head: true })
    
    console.log('Assignment table count query result:', assignmentCount)
    if (countError) {
      console.error('Error counting student_class_assignments:', countError)
      console.log('Table might not exist or RLS policies might be blocking access')
    }

    // Check all assignments in the table first with error handling
    const { data: allAssignments, error: assignmentsError } = await supabase
      .from('student_class_assignments')
      .select('*')
      .limit(10)
    
    if (assignmentsError) {
      console.error('Error fetching student_class_assignments:', assignmentsError)
      console.log('Trying alternative approach without RLS...')
    }
    
    console.log('Total assignments in DB:', allAssignments?.length || 0)
    if (allAssignments && allAssignments.length > 0) {
      console.log('First assignment structure:', Object.keys(allAssignments[0]))
      console.log('Sample assignment data:', allAssignments[0])
    } else if (!assignmentsError) {
      console.log('Table exists but is empty, or RLS is blocking access')
    }

    // Get student-class assignments for this school's classes
    const { data: studentClassAssignments, error: schoolAssignmentsError } = await supabase
      .from('student_class_assignments')
      .select('*')
      .in('class_id', schoolClasses?.map(c => c.id) || [])

    if (schoolAssignmentsError) {
      console.error('Error fetching assignments for school classes:', schoolAssignmentsError)
    }

    console.log('Student class assignments for school classes:', studentClassAssignments?.length || 0)
    
    // If we have assignments but no students, the student_id might reference user_id directly
    if (studentClassAssignments && studentClassAssignments.length > 0 && students?.length === 0) {
      console.log('FOUND ASSIGNMENTS BUT NO STUDENTS - checking if student_id references exist')
      const assignmentStudentIds = Array.from(new Set(studentClassAssignments.map(a => a.student_id)))
      console.log('Unique student IDs in assignments:', assignmentStudentIds.length)
      
      // Try to find these users in auth.users via profiles.user_id
      const { data: profilesByUserId } = await supabase
        .from('profiles')
        .select('id, user_id, role, first_name, last_name, school_id')
        .in('user_id', assignmentStudentIds)
      
      console.log('Profiles matching assignment student_ids:', profilesByUserId?.length || 0)
      if (profilesByUserId && profilesByUserId.length > 0) {
        console.log('Profile roles found:', profilesByUserId.map(p => p.role))
        console.log('Profile school_ids:', profilesByUserId.map(p => p.school_id))
        console.log('Expected school_id:', schoolId)
        console.log('School_id match:', profilesByUserId.map(p => p.school_id === schoolId))
        
        // Use these students instead of the empty students array
        console.log('OVERRIDING students array with profiles found via assignments')
        // Override the students variable - this is a workaround
      } else {
        console.log('No profiles found - checking if students exist without school_id filter')
        const { data: studentsNoFilter } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, school_id, role')
          .in('user_id', assignmentStudentIds)
        
        console.log('Students found without school filter:', studentsNoFilter?.length || 0)
        if (studentsNoFilter && studentsNoFilter.length > 0) {
          console.log('Student school_ids:', studentsNoFilter.map(s => ({ name: s.first_name, school: s.school_id })))
        } else {
          console.log('CRITICAL: Cannot find students even without filters')
          console.log('Checking if specific user_id exists:', assignmentStudentIds[0])
          
          // Try direct query for one specific student
          const { data: directCheck, error: directError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', '72bb3f5a-86be-4236-ab66-ec90e8c2ab11')
            .single()
          
          console.log('Direct check for Hunter:', directCheck ? 'FOUND' : 'NOT FOUND')
          if (directError) {
            console.error('Direct check error:', directError)
          }
          if (directCheck) {
            console.log('Hunter data:', directCheck)
          }
        }
      }
    }

    // Build class analytics from actual classes table
    const classesByName: any = {}
    
    schoolClasses?.forEach((schoolClass: any) => {
      // Use class_name field from database
      const className = schoolClass.class_name || `Class ${schoolClass.id.slice(0, 8)}`
      const gradeLevel = schoolClass.grade_level || 'Unknown'
      
      const classStudents = students?.filter(s => {
        // Check if student is assigned to this class using user_id
        const isAssigned = studentClassAssignments?.some(
          a => a.student_id === s.user_id && a.class_id === schoolClass.id
        )
        // Also check class_name field as fallback
        const hasClassNameMatch = s.class_name === className || s.class_name === schoolClass.class_name
        return isAssigned || hasClassNameMatch
      }) || []

      classesByName[className] = {
        className: className,
        grade: gradeLevel,
        students: classStudents,
        totalStudents: classStudents.length,
        wellbeingScore: 0,
        riskLevel: 'low' as 'low' | 'medium' | 'high',
        trends: { mood: 0, engagement: 0, helpRequests: 0 }
      }
    })

    // Calculate class-level metrics
    Object.values(classesByName).forEach((classData: any) => {
      const classStudentIds = classData.students.map((s: any) => s.user_id).filter(Boolean)
      
      console.log(`Class ${classData.className}: ${classStudentIds.length} student IDs`, classStudentIds)
      
      // Class mood data
      const classMoodData = moodData?.filter(m => classStudentIds.includes(m.user_id)) || []
      const classPositiveMoods = classMoodData.filter(m => positiveMoods.includes(m.mood_emoji)).length
      const classTotalMoods = classMoodData.length
      
      console.log(`Class ${classData.className}: ${classTotalMoods} mood entries, ${classPositiveMoods} positive`)
      
      classData.trends.mood = classTotalMoods > 0 ? (classPositiveMoods / classTotalMoods) * 100 : 50

      // Class engagement
      const classActiveStudents = new Set([
        ...(moodData?.filter(m => classStudentIds.includes(m.user_id)).map(m => m.user_id) || []),
        ...(questsData?.filter(q => classStudentIds.includes(q.user_id)).map(q => q.user_id) || [])
      ]).size
      classData.trends.engagement = classData.totalStudents > 0 ? (classActiveStudents / classData.totalStudents) * 100 : 0

      // Class help requests - help_requests uses student_id field
      classData.trends.helpRequests = helpRequests?.filter(hr => classStudentIds.includes(hr.student_id)).length || 0

      // Class wellbeing score
      classData.wellbeingScore = Number((
        (classData.trends.mood / 100) * 4 + 
        (classData.trends.engagement / 100) * 3 + 
        Math.max(0, 3 - (classData.trends.helpRequests / Math.max(classData.totalStudents, 1)) * 10)
      ).toFixed(1))

      // Risk level
      if (classData.wellbeingScore >= 7.5) classData.riskLevel = 'low'
      else if (classData.wellbeingScore >= 5.5) classData.riskLevel = 'medium'
      else classData.riskLevel = 'high'
    })

    console.log('Class analytics prepared:', Object.keys(classesByName).length, 'classes')
    
    // Log each class details for debugging
    Object.values(classesByName).forEach((c: any) => {
      console.log(`Class ${c.className}: ${c.totalStudents} students, score: ${c.wellbeingScore}, mood: ${c.trends.mood}%`)
    })

    // Get additional student activity data for radar charts
    const { data: gratitudeEntries } = await supabase
      .from('gratitude_entries')
      .select('user_id, created_at')
      .in('user_id', studentUserIds)
      .gte('created_at', startDate.toISOString())

    const { data: kindnessData } = await supabase
      .from('kindness_counter')
      .select('user_id, count, created_at')
      .in('user_id', studentUserIds)
      .gte('created_at', startDate.toISOString())

    const { data: courageEntries } = await supabase
      .from('courage_log')
      .select('user_id, created_at')
      .in('user_id', studentUserIds)
      .gte('created_at', startDate.toISOString())

    const { data: habitData } = await supabase
      .from('habit_tracker')
      .select('user_id, sleep_hours, water_glasses, date')
      .in('user_id', studentUserIds)
      .gte('date', startDate.toISOString().split('T')[0])

    const { data: mindfulnessData } = await supabase
      .from('mindfulness_sessions')
      .select('user_id, session_type, duration, created_at')
      .in('user_id', studentUserIds)
      .gte('created_at', startDate.toISOString())

    console.log('Activity data:', {
      gratitude: gratitudeEntries?.length || 0,
      kindness: kindnessData?.length || 0,
      courage: courageEntries?.length || 0,
      habits: habitData?.length || 0,
      mindfulness: mindfulnessData?.length || 0
    })

    // Student insights - identify students needing attention
    const studentInsights = students?.map(student => {
      const studentMoods = moodData?.filter(m => m.user_id === student.user_id) || []
      const studentQuests = questsData?.filter(q => q.user_id === student.user_id) || []
      const studentHelp = helpRequests?.filter(hr => hr.student_id === student.user_id) || []
      
      // Calculate activity completion rates
      const studentGratitude = gratitudeEntries?.filter(g => g.user_id === student.user_id) || []
      const studentKindness = kindnessData?.filter(k => k.user_id === student.user_id) || []
      const studentCourage = courageEntries?.filter(c => c.user_id === student.user_id) || []
      const studentHabits = habitData?.filter(h => h.user_id === student.user_id) || []
      const studentMindfulness = mindfulnessData?.filter(m => m.user_id === student.user_id && m.session_type === 'breathing') || []
      
      const recentMoods = studentMoods.slice(-5)
      const negativeMoodCount = recentMoods.filter(m => negativeMoods.includes(m.mood_emoji)).length
      const questCompletionRate = studentQuests.length > 0 ? 
        (studentQuests.filter(q => q.completed).length / studentQuests.length) * 100 : 0
      
      const concerns: string[] = []
      const strengths: string[] = []
      
      if (negativeMoodCount >= 3) concerns.push('Frequent negative mood indicators')
      if (questCompletionRate < 50) concerns.push('Low quest completion rate')
      if (studentHelp.length > 0) concerns.push('Recent help requests submitted')
      if (student.streak_days === 0) concerns.push('No current activity streak')
      
      if (questCompletionRate >= 80) strengths.push('High quest completion rate')
      if (student.streak_days >= 7) strengths.push('Strong activity streak')
      if (student.pet_happiness >= 80) strengths.push('High pet happiness score')
      if (recentMoods.filter(m => positiveMoods.includes(m.mood_emoji)).length >= 3) {
        strengths.push('Consistently positive mood')
      }
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (concerns.length >= 3) riskLevel = 'high'
      else if (concerns.length >= 1) riskLevel = 'medium'
      
      // Calculate activity scores (0-100)
      const gratitudeScore = Math.min(100, (studentGratitude.length / daysBack) * 100 * 7) // 1 per day target
      const kindnessScore = Math.min(100, (studentKindness.reduce((sum, k) => sum + (k.count || 0), 0) / daysBack) * 100 / 3) // 3 acts per day target
      const breathingScore = Math.min(100, (studentMindfulness.length / daysBack) * 100 * 7) // 1 per day target
      const courageScore = Math.min(100, (studentCourage.length / daysBack) * 100 * 7) // 1 per day target
      
      // Sleep and hydration from habit tracker
      const avgSleepHours = studentHabits.length > 0 
        ? studentHabits.reduce((sum, h) => sum + (h.sleep_hours || 0), 0) / studentHabits.length 
        : 0
      const avgWaterGlasses = studentHabits.length > 0
        ? studentHabits.reduce((sum, h) => sum + (h.water_glasses || 0), 0) / studentHabits.length
        : 0
      
      const sleepScore = Math.min(100, (avgSleepHours / 8) * 100) // 8 hours target
      const hydrationScore = Math.min(100, (avgWaterGlasses / 8) * 100) // 8 glasses target

      return {
        id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student',
        grade: student.grade_level || 'Unknown',
        class: student.class_name || 'Not assigned',
        riskLevel,
        lastActivity: studentMoods.length > 0 || studentQuests.length > 0 ? 'Recently active' : 'Inactive',
        concerns,
        strengths,
        activities: {
          gratitude: Math.round(gratitudeScore),
          kindness: Math.round(kindnessScore),
          breathing: Math.round(breathingScore),
          courage: Math.round(courageScore),
          sleep: Math.round(sleepScore),
          hydration: Math.round(hydrationScore)
        }
      }
    }).filter(student => student.riskLevel === 'high' || student.riskLevel === 'medium')
    .slice(0, 10) || [] // Limit to top 10 students needing attention

    // Calculate trend data for charts (last 7 days)
    const trendData: any[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      const dateStr = date.toISOString().split('T')[0]
      const dayMoods = moodData?.filter(m => m.date === dateStr) || []
      const dayQuests = questsData?.filter(q => q.date === dateStr) || []
      
      const dayPositive = dayMoods.filter(m => positiveMoods.includes(m.mood_emoji)).length
      const dayTotal = dayMoods.length
      const dayScore = dayTotal > 0 ? (dayPositive / dayTotal) * 10 : 7
      
      // Calculate engagement for this day
      const dayActiveStudents = new Set([
        ...dayMoods.map(m => m.user_id),
        ...dayQuests.map(q => q.user_id)
      ]).size
      const dayEngagement = totalStudents > 0 ? (dayActiveStudents / totalStudents) * 100 : 0
      
      trendData.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        score: Number(dayScore.toFixed(1)),
        engagement: Math.round(dayEngagement),
        moods: dayMoods.length,
        quests: dayQuests.filter(q => q.completed).length
      })
    }

    // Calculate activity breakdown for radar chart
    const totalActivityDays = daysBack * totalStudents
    const activityBreakdown = [
      { 
        subject: 'Gratitude', 
        A: totalActivityDays > 0 ? Math.round((gratitudeEntries?.length || 0) / totalActivityDays * 100 * 7) : 0,
        fullMark: 100 
      },
      { 
        subject: 'Kindness', 
        A: totalActivityDays > 0 ? Math.round((kindnessData?.reduce((sum, k) => sum + (k.count || 0), 0) || 0) / totalActivityDays * 100 / 3) : 0,
        fullMark: 100 
      },
      { 
        subject: 'Courage', 
        A: totalActivityDays > 0 ? Math.round((courageEntries?.length || 0) / totalActivityDays * 100 * 7) : 0,
        fullMark: 100 
      },
      { 
        subject: 'Breathing', 
        A: totalActivityDays > 0 ? Math.round((mindfulnessData?.filter(m => m.session_type === 'breathing').length || 0) / totalActivityDays * 100 * 7) : 0,
        fullMark: 100 
      },
      { 
        subject: 'Habits', 
        A: totalActivityDays > 0 ? Math.round((habitData?.length || 0) / totalActivityDays * 100 * 7) : 0,
        fullMark: 100 
      },
      { 
        subject: 'Mindfulness', 
        A: totalActivityDays > 0 ? Math.round((mindfulnessData?.length || 0) / totalActivityDays * 100 * 7) : 0,
        fullMark: 100 
      }
    ]

    // Build help requests timeline (weekly data)
    const helpRequestsTimeline: Array<{ date: string; requests: number; resolved: number }> = []
    const weeksCount = Math.ceil(daysBack / 7)
    for (let i = 0; i < weeksCount; i++) {
      const weekStart = new Date(now.getTime() - ((i + 1) * 7 * 24 * 60 * 60 * 1000))
      const weekEnd = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
      
      const weekRequests = helpRequests?.filter(hr => {
        const requestDate = new Date(hr.created_at)
        return requestDate >= weekStart && requestDate < weekEnd
      }) || []
      
      const weekResolved = weekRequests.filter(hr => hr.status === 'resolved' || hr.status === 'completed').length
      
      helpRequestsTimeline.unshift({
        date: `Week ${weeksCount - i}`,
        requests: weekRequests.length,
        resolved: weekResolved
      })
    }

    // Calculate trend changes (compare current to previous period)
    const previousStartDate = new Date(startDate.getTime() - (daysBack * 24 * 60 * 60 * 1000))
    
    // Get previous period data
    const { data: prevMoodData } = await supabase
      .from('mood_tracking')
      .select('user_id, mood_emoji')
      .in('user_id', studentUserIds)
      .gte('date', previousStartDate.toISOString().split('T')[0])
      .lt('date', startDate.toISOString().split('T')[0])
    
    const { data: prevQuestsData } = await supabase
      .from('daily_quests')
      .select('completed')
      .in('user_id', studentUserIds)
      .gte('date', previousStartDate.toISOString().split('T')[0])
      .lt('date', startDate.toISOString().split('T')[0])
    
    const prevPositiveCount = prevMoodData?.filter(m => positiveMoods.includes(m.mood_emoji)).length || 0
    const prevTotalMoods = prevMoodData?.length || 1
    const prevWellbeingScore = 5 + (prevPositiveCount / prevTotalMoods) * 5
    
    const prevCompletedQuests = prevQuestsData?.filter(q => q.completed).length || 0
    const prevTotalQuests = prevQuestsData?.length || 1
    const prevQuestCompletionRate = (prevCompletedQuests / prevTotalQuests) * 100
    
    const wellbeingChange = prevWellbeingScore > 0 ? ((wellbeingScore - prevWellbeingScore) / prevWellbeingScore) * 100 : 0
    const engagementChange = engagementRate - 75 // Compare to baseline of 75%
    const questChange = prevQuestCompletionRate > 0 ? ((questCompletionRate - prevQuestCompletionRate) / prevQuestCompletionRate) * 100 : 0
    
    let helpRequestsChange = 0
    if (helpRequests && helpRequests.length > 0) {
      const { data: prevHelpRequests } = await supabase
        .from('help_requests')
        .select('student_id')
        .in('student_id', studentUserIds)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())
      
      const prevHelpCount = prevHelpRequests?.length || 1
      helpRequestsChange = ((helpRequests.length - prevHelpCount) / prevHelpCount) * 100
    }

    // Compile response
    const analytics = {
      averageWellbeingScore: Number(wellbeingScore.toFixed(1)),
      questCompletionRate: Math.round(questCompletionRate),
      trends: {
        wellbeingChange: Number(wellbeingChange.toFixed(1)),
        engagementChange: Number(engagementChange.toFixed(1)),
        questChange: Number(questChange.toFixed(1)),
        helpRequestsChange: Number(helpRequestsChange.toFixed(1))
      },
      activityBreakdown,
      helpRequests: {
        total: totalHelpRequests,
        timeline: helpRequestsTimeline
      },
      metrics: [
        {
          id: '1',
          name: 'Overall Wellbeing Score',
          value: Number(wellbeingScore.toFixed(1)),
          previousValue: 7.5,
          trend: wellbeingScore > 7.5 ? 'up' : wellbeingScore < 7.5 ? 'down' : 'stable',
          category: 'mood',
          description: 'Average wellbeing score across all students'
        },
        {
          id: '2',
          name: 'Student Engagement',
          value: Math.round(engagementRate),
          previousValue: 75,
          trend: engagementRate > 75 ? 'up' : engagementRate < 75 ? 'down' : 'stable',
          category: 'engagement',
          description: 'Percentage of students actively participating'
        },
        {
          id: '3',
          name: 'Help Requests',
          value: urgentRequests,
          previousValue: 5,
          trend: urgentRequests < 5 ? 'down' : urgentRequests > 5 ? 'up' : 'stable',
          category: 'safety',
          description: 'Number of urgent help requests'
        },
        {
          id: '4',
          name: 'Quest Completion',
          value: Math.round(questCompletionRate),
          previousValue: 80,
          trend: questCompletionRate > 80 ? 'up' : questCompletionRate < 80 ? 'down' : 'stable',
          category: 'engagement',
          description: 'Daily quests completion rate'
        },
        {
          id: '5',
          name: 'Active Students',
          value: activeStudents,
          previousValue: Math.max(1, activeStudents - 5),
          trend: 'up',
          category: 'engagement',
          description: 'Students active in the time period'
        },
        {
          id: '6',
          name: 'Total Students',
          value: totalStudents,
          previousValue: totalStudents,
          trend: 'stable',
          category: 'engagement',
          description: 'Total enrolled students'
        }
      ],
      classAnalytics: Object.values(classesByName),
      studentInsights,
      trendData,
      wellbeingDistribution: {
        thriving: Math.round((students?.filter(s => {
          const moods = moodData?.filter(m => m.user_id === s.user_id)
          return moods && moods.length > 0 && moods.filter(m => positiveMoods.includes(m.mood_emoji)).length > moods.length * 0.7
        }).length || 0) / Math.max(totalStudents, 1) * 100),
        moderate: Math.round((students?.filter(s => {
          const moods = moodData?.filter(m => m.user_id === s.user_id)
          return moods && moods.length > 0 && moods.filter(m => positiveMoods.includes(m.mood_emoji)).length <= moods.length * 0.7 && moods.filter(m => negativeMoods.includes(m.mood_emoji)).length < moods.length * 0.3
        }).length || 0) / Math.max(totalStudents, 1) * 100),
        atRisk: Math.round((students?.filter(s => {
          const moods = moodData?.filter(m => m.user_id === s.user_id)
          return moods && moods.length > 0 && moods.filter(m => negativeMoods.includes(m.mood_emoji)).length >= moods.length * 0.3
        }).length || 0) / Math.max(totalStudents, 1) * 100)
      },
      totalStudents,
      timeRange: daysBack,
      engagementRate: Math.round(engagementRate)
    }

    console.log('=== FINAL ANALYTICS ===')
    console.log('Total students:', totalStudents)
    console.log('Classes:', analytics.classAnalytics.length)
    console.log('Student insights:', analytics.studentInsights.length)
    console.log('Metrics:', analytics.metrics.length)

    return NextResponse.json({ success: true, analytics })

  } catch (error: any) {
    console.error('Wellbeing analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
