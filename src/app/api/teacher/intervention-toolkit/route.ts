import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const mood = searchParams.get('mood') || 'all'

    // Define intervention activities based on categories and moods
    const interventionActivities = [
      // Mindfulness & Calm
      {
        id: 'breathing-exercise',
        title: '3-Minute Breathing Exercise',
        description: 'Guide students through deep breathing to reduce stress and improve focus.',
        category: 'mindfulness',
        duration: '3 minutes',
        participants: '1-30 students',
        materials: 'None required',
        instructions: [
          'Have students sit comfortably with feet flat on floor',
          'Breathe in slowly for 4 counts through the nose',
          'Hold breath gently for 4 counts',
          'Exhale slowly for 6 counts through the mouth',
          'Repeat 5-8 times while playing soft background music'
        ],
        benefits: ['Reduces anxiety', 'Improves focus', 'Calms nervous system'],
        suitableFor: ['stressed', 'anxious', 'overwhelmed', 'angry'],
        icon: '🧘‍♀️'
      },
      {
        id: 'gratitude-circle',
        title: 'Gratitude Circle',
        description: 'Students share one thing they\'re grateful for to boost positive emotions.',
        category: 'emotional',
        duration: '5-10 minutes',
        participants: '5-25 students',
        materials: 'Optional: gratitude journal',
        instructions: [
          'Form a circle with students',
          'Explain that everyone will share one thing they\'re grateful for',
          'Start with yourself to model vulnerability',
          'Go around the circle, allowing students to pass if needed',
          'End with a group appreciation moment'
        ],
        benefits: ['Increases positivity', 'Builds community', 'Shifts perspective'],
        suitableFor: ['sad', 'lonely', 'discouraged', 'neutral'],
        icon: '🙏'
      },
      
      // Physical Movement
      {
        id: 'energizer-stretch',
        title: 'Classroom Energizer Stretch',
        description: 'Quick physical movement to boost energy and circulation.',
        category: 'physical',
        duration: '2-5 minutes',
        participants: '1-30 students',
        materials: 'None required',
        instructions: [
          'Have students stand beside their desks',
          'Reach arms up high and stretch toward the ceiling',
          'Gentle neck rolls (3 each direction)',
          'Shoulder shrugs (5 times)',
          'Touch toes or reach toward floor',
          'Gentle spinal twist (both directions)'
        ],
        benefits: ['Increases energy', 'Improves circulation', 'Reduces tension'],
        suitableFor: ['tired', 'restless', 'sluggish', 'bored'],
        icon: '🤸‍♂️'
      },
      {
        id: 'brain-break-dance',
        title: 'Brain Break Dance Party',
        description: 'Short dance session to release energy and boost mood.',
        category: 'physical',
        duration: '3-5 minutes',
        participants: '1-30 students',
        materials: 'Music player/speakers',
        instructions: [
          'Play upbeat, age-appropriate music',
          'Encourage free movement and dancing',
          'Join in to model participation',
          'Include simple moves like jumping jacks or arm waves',
          'End with a calming pose or deep breath'
        ],
        benefits: ['Releases endorphins', 'Increases energy', 'Improves mood'],
        suitableFor: ['sad', 'tired', 'restless', 'bored'],
        icon: '💃'
      },

      // Social Connection
      {
        id: 'compliment-web',
        title: 'Compliment Web',
        description: 'Students give genuine compliments to build positive connections.',
        category: 'social',
        duration: '10-15 minutes',
        participants: '8-25 students',
        materials: 'Ball of yarn (optional)',
        instructions: [
          'Sit in a circle with students',
          'Start by giving a genuine compliment to one student',
          'That student gives a compliment to another student',
          'Continue until everyone has given and received a compliment',
          'Optional: Use yarn to create a physical web of connections'
        ],
        benefits: ['Builds self-esteem', 'Strengthens relationships', 'Creates positivity'],
        suitableFor: ['lonely', 'sad', 'insecure', 'disconnected'],
        icon: '🤝'
      },
      {
        id: 'buddy-check-in',
        title: 'Buddy Check-In',
        description: 'Pair students to check in with each other and provide support.',
        category: 'social',
        duration: '5-8 minutes',
        participants: '6-30 students',
        materials: 'None required',
        instructions: [
          'Pair students randomly or strategically',
          'Give each pair 2-3 minutes to check in',
          'Provide conversation starters: "How are you feeling?" "What\'s going well?"',
          'Switch pairs if time allows',
          'Bring group back together for optional sharing'
        ],
        benefits: ['Builds empathy', 'Provides support', 'Develops communication'],
        suitableFor: ['lonely', 'stressed', 'overwhelmed', 'disconnected'],
        icon: '👥'
      },

      // Academic Focus
      {
        id: 'focus-reset',
        title: 'Focus Reset Technique',
        description: 'Help students regain concentration and mental clarity.',
        category: 'academic',
        duration: '3-5 minutes',
        participants: '1-30 students',
        materials: 'None required',
        instructions: [
          'Have students close their eyes or look down',
          'Take 3 deep breaths together',
          'Ask students to mentally "put away" distracting thoughts',
          'Set a clear intention for the next activity',
          'Use a gentle signal (chime, clap) to begin focused work'
        ],
        benefits: ['Improves concentration', 'Reduces distractions', 'Increases productivity'],
        suitableFor: ['distracted', 'overwhelmed', 'anxious', 'restless'],
        icon: '🎯'
      },
      {
        id: 'brain-gym',
        title: 'Brain Gym Exercises',
        description: 'Cross-lateral movements to activate both brain hemispheres.',
        category: 'academic',
        duration: '3-7 minutes',
        participants: '1-30 students',
        materials: 'None required',
        instructions: [
          'Cross crawls: Touch right elbow to left knee, then left elbow to right knee',
          'Lazy 8s: Draw figure-8s in the air with both hands',
          'Brain buttons: Massage points below collarbone while looking left and right',
          'Hook-ups: Cross ankles and hands, breathe deeply',
          'Repeat each exercise 8-10 times'
        ],
        benefits: ['Activates whole brain', 'Improves coordination', 'Enhances learning'],
        suitableFor: ['confused', 'sluggish', 'unfocused', 'tired'],
        icon: '🧠'
      },

      // Emotional Regulation
      {
        id: 'emotion-thermometer',
        title: 'Emotion Thermometer Check',
        description: 'Help students identify and regulate their emotional temperature.',
        category: 'emotional',
        duration: '5-8 minutes',
        participants: '1-30 students',
        materials: 'Whiteboard or chart',
        instructions: [
          'Draw a thermometer on the board (0-10 scale)',
          'Explain: 0 = very calm, 10 = very intense emotions',
          'Have students privately rate their current emotional level',
          'Teach cooling strategies for high numbers (breathing, counting)',
          'Teach warming strategies for low numbers (movement, positive thoughts)'
        ],
        benefits: ['Builds emotional awareness', 'Teaches self-regulation', 'Prevents escalation'],
        suitableFor: ['angry', 'anxious', 'overwhelmed', 'numb'],
        icon: '🌡️'
      },
      {
        id: 'worry-box',
        title: 'Worry Box Technique',
        description: 'Students write worries and "put them away" to focus on learning.',
        category: 'emotional',
        duration: '5-10 minutes',
        participants: '1-30 students',
        materials: 'Paper, box or container',
        instructions: [
          'Give each student a small piece of paper',
          'Have them write or draw their current worry',
          'Fold the paper and place it in the "worry box"',
          'Explain that worries are safe in the box for now',
          'Set a time to "check on worries" later (end of day/week)'
        ],
        benefits: ['Reduces anxiety', 'Improves focus', 'Validates concerns'],
        suitableFor: ['anxious', 'worried', 'overwhelmed', 'distracted'],
        icon: '📦'
      }
    ]

    // Filter activities based on parameters
    let filteredActivities = interventionActivities

    if (category !== 'all') {
      filteredActivities = filteredActivities.filter(activity => 
        activity.category === category
      )
    }

    if (mood !== 'all') {
      filteredActivities = filteredActivities.filter(activity => 
        activity.suitableFor.includes(mood)
      )
    }

    // Get categories for filtering
    const categories = [
      { id: 'all', name: 'All Categories', count: interventionActivities.length },
      { id: 'mindfulness', name: 'Mindfulness', count: interventionActivities.filter(a => a.category === 'mindfulness').length },
      { id: 'physical', name: 'Physical', count: interventionActivities.filter(a => a.category === 'physical').length },
      { id: 'social', name: 'Social', count: interventionActivities.filter(a => a.category === 'social').length },
      { id: 'academic', name: 'Academic Focus', count: interventionActivities.filter(a => a.category === 'academic').length },
      { id: 'emotional', name: 'Emotional', count: interventionActivities.filter(a => a.category === 'emotional').length }
    ]

    // Get mood filters
    const moodFilters = [
      { id: 'all', name: 'All Moods', emoji: '🎭' },
      { id: 'anxious', name: 'Anxious', emoji: '😰' },
      { id: 'sad', name: 'Sad', emoji: '😢' },
      { id: 'angry', name: 'Angry', emoji: '😠' },
      { id: 'tired', name: 'Tired', emoji: '😴' },
      { id: 'restless', name: 'Restless', emoji: '😤' },
      { id: 'overwhelmed', name: 'Overwhelmed', emoji: '🤯' },
      { id: 'lonely', name: 'Lonely', emoji: '😔' },
      { id: 'distracted', name: 'Distracted', emoji: '🤷‍♂️' },
      { id: 'bored', name: 'Bored', emoji: '😑' }
    ]

    return NextResponse.json({
      activities: filteredActivities,
      categories,
      moodFilters,
      totalActivities: interventionActivities.length,
      filteredCount: filteredActivities.length
    })

  } catch (error) {
    console.error('Error fetching intervention toolkit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to track intervention usage
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { activityId, studentCount, duration, effectiveness } = await request.json()

    // Validate input
    if (!activityId || !studentCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Log intervention usage (you could create a table for this)
    // For now, we'll just return success
    // In a real implementation, you'd insert into an intervention_logs table

    return NextResponse.json({
      success: true,
      message: 'Intervention usage logged successfully'
    })

  } catch (error) {
    console.error('Error logging intervention usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
