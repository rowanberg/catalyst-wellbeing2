import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Predefined intervention activities database
const interventionActivities = [
  {
    id: 'mindful-breathing-1',
    title: '3-Minute Breathing Space',
    description: 'A quick mindfulness exercise to help students center themselves and reduce anxiety.',
    category: 'mindfulness',
    duration: 3,
    difficulty: 'easy',
    targetMoods: ['😰', 'anxious', '😠', 'angry'],
    materials: ['None required'],
    instructions: [
      'Ask students to sit comfortably with feet on the floor',
      'Guide them to take 3 deep breaths, counting slowly',
      'Have them notice their breath without changing it',
      'Ask them to scan their body for any tension',
      'End with 3 more intentional deep breaths'
    ],
    benefits: [
      'Reduces immediate stress and anxiety',
      'Improves focus and attention',
      'Teaches self-regulation skills'
    ],
    ageGroups: ['elementary', 'middle', 'high'],
    classSize: 'whole_class',
    effectiveness: 4
  },
  {
    id: 'movement-break-1',
    title: 'Energizing Movement Break',
    description: 'Physical activities to boost energy and improve mood through movement.',
    category: 'movement',
    duration: 5,
    difficulty: 'easy',
    targetMoods: ['😢', 'sad', '😌', 'calm'],
    materials: ['Open space'],
    instructions: [
      'Have students stand up and stretch their arms overhead',
      'Lead 10 jumping jacks or marching in place',
      'Do shoulder rolls and neck stretches',
      'Try simple yoga poses like mountain pose',
      'End with gentle shaking out of arms and legs'
    ],
    benefits: [
      'Increases energy and alertness',
      'Releases endorphins for mood boost',
      'Improves circulation and focus'
    ],
    ageGroups: ['elementary', 'middle', 'high'],
    classSize: 'whole_class',
    effectiveness: 5
  },
  {
    id: 'social-connection-1',
    title: 'Gratitude Circle',
    description: 'Students share something they are grateful for to build positive connections.',
    category: 'social',
    duration: 10,
    difficulty: 'easy',
    targetMoods: ['😢', 'sad', '😠', 'angry'],
    materials: ['None required'],
    instructions: [
      'Have students sit in a circle or arrange desks in a circle',
      'Explain that everyone will share one thing they are grateful for',
      'Start with yourself to model the activity',
      'Go around the circle, allowing students to pass if needed',
      'Thank everyone for sharing and highlight common themes'
    ],
    benefits: [
      'Builds classroom community',
      'Shifts focus to positive aspects',
      'Develops empathy and listening skills'
    ],
    ageGroups: ['elementary', 'middle', 'high'],
    classSize: 'whole_class',
    effectiveness: 4
  },
  {
    id: 'academic-reset-1',
    title: 'Brain Break Quiz',
    description: 'Fun, low-stakes questions to re-engage academic thinking while reducing pressure.',
    category: 'academic',
    duration: 7,
    difficulty: 'medium',
    targetMoods: ['😰', 'anxious', '😌', 'calm'],
    materials: ['Prepared questions', 'Whiteboard or slides'],
    instructions: [
      'Prepare 5-7 fun, easy questions related to recent lessons',
      'Make it clear this is just for fun, no grades',
      'Allow students to work in pairs or small groups',
      'Encourage discussion and explanation of answers',
      'Celebrate all participation, not just correct answers'
    ],
    benefits: [
      'Re-engages academic thinking',
      'Builds confidence through success',
      'Reduces academic anxiety'
    ],
    ageGroups: ['middle', 'high'],
    classSize: 'whole_class',
    effectiveness: 3
  },
  {
    id: 'emotional-check-in-1',
    title: 'Emotion Wheel Check-In',
    description: 'Help students identify and express their current emotional state.',
    category: 'emotional',
    duration: 8,
    difficulty: 'medium',
    targetMoods: ['😢', 'sad', '😠', 'angry', '😰', 'anxious'],
    materials: ['Emotion wheel poster or handout'],
    instructions: [
      'Display an emotion wheel with various feeling words',
      'Ask students to silently identify their current emotion',
      'Have them write it down or point to it on their own wheel',
      'Optionally, allow volunteers to share their emotion',
      'Discuss healthy ways to handle different emotions'
    ],
    benefits: [
      'Develops emotional vocabulary',
      'Increases self-awareness',
      'Validates all emotions as normal'
    ],
    ageGroups: ['elementary', 'middle', 'high'],
    classSize: 'whole_class',
    effectiveness: 4
  },
  {
    id: 'mindful-coloring-1',
    title: 'Mindful Coloring',
    description: 'Calming coloring activity that promotes focus and reduces stress.',
    category: 'mindfulness',
    duration: 15,
    difficulty: 'easy',
    targetMoods: ['😰', 'anxious', '😠', 'angry'],
    materials: ['Coloring sheets', 'Colored pencils or crayons'],
    instructions: [
      'Distribute simple mandala or pattern coloring sheets',
      'Encourage students to focus only on the coloring',
      'Play soft background music if available',
      'Remind them there is no right or wrong way to color',
      'Allow students to continue until they feel calmer'
    ],
    benefits: [
      'Promotes relaxation and calm',
      'Improves focus and concentration',
      'Provides creative outlet for stress'
    ],
    ageGroups: ['elementary', 'middle'],
    classSize: 'whole_class',
    effectiveness: 4
  },
  {
    id: 'team-building-1',
    title: 'Two Truths and a Dream',
    description: 'Modified version of two truths and a lie that focuses on positive aspirations.',
    category: 'social',
    duration: 12,
    difficulty: 'medium',
    targetMoods: ['😢', 'sad', '😌', 'calm'],
    materials: ['None required'],
    instructions: [
      'Explain that students will share two true facts and one dream/goal',
      'Give students 2 minutes to think of their three statements',
      'Have students share in small groups of 3-4',
      'Others guess which statement is the dream',
      'Encourage positive responses to all dreams shared'
    ],
    benefits: [
      'Builds positive classroom relationships',
      'Encourages goal-setting and aspiration',
      'Creates supportive peer connections'
    ],
    ageGroups: ['middle', 'high'],
    classSize: 'small_group',
    effectiveness: 4
  },
  {
    id: 'stress-release-1',
    title: 'Progressive Muscle Relaxation',
    description: 'Systematic tensing and relaxing of muscle groups to reduce physical stress.',
    category: 'mindfulness',
    duration: 10,
    difficulty: 'medium',
    targetMoods: ['😰', 'anxious', '😠', 'angry'],
    materials: ['Quiet space'],
    instructions: [
      'Have students sit comfortably or lie down if possible',
      'Guide them to tense their toes for 5 seconds, then relax',
      'Move up through legs, abdomen, arms, and face',
      'Hold each tension for 5 seconds, then relax for 10',
      'End with whole body tension, then complete relaxation'
    ],
    benefits: [
      'Reduces physical tension and stress',
      'Teaches body awareness',
      'Provides tool for self-regulation'
    ],
    ageGroups: ['middle', 'high'],
    classSize: 'whole_class',
    effectiveness: 5
  },
  {
    id: 'creative-expression-1',
    title: 'Feeling Faces Art',
    description: 'Students create art representing their emotions to process feelings.',
    category: 'emotional',
    duration: 20,
    difficulty: 'easy',
    targetMoods: ['😢', 'sad', '😠', 'angry', '😰', 'anxious'],
    materials: ['Paper', 'Art supplies (crayons, markers, etc.)'],
    instructions: [
      'Give each student a blank piece of paper',
      'Ask them to draw a face showing how they feel right now',
      'Encourage use of colors that match their emotions',
      'Allow 10-15 minutes for creation',
      'Optionally, have students share their artwork'
    ],
    benefits: [
      'Provides emotional outlet through creativity',
      'Helps process difficult feelings',
      'Develops emotional expression skills'
    ],
    ageGroups: ['elementary', 'middle'],
    classSize: 'whole_class',
    effectiveness: 4
  },
  {
    id: 'focus-game-1',
    title: 'Mindful Listening Game',
    description: 'Attention-focusing game using sounds to improve concentration.',
    category: 'mindfulness',
    duration: 6,
    difficulty: 'easy',
    targetMoods: ['😰', 'anxious', '😌', 'calm'],
    materials: ['Bell or chime', 'Various small objects'],
    instructions: [
      'Ring a bell and ask students to listen until they cannot hear it',
      'Have them raise their hand when the sound completely stops',
      'Try making quiet sounds (paper rustling, pencil tapping)',
      'Students identify the sounds with eyes closed',
      'End with one final bell for complete silence'
    ],
    benefits: [
      'Improves attention and focus',
      'Develops mindful listening skills',
      'Calms busy minds'
    ],
    ageGroups: ['elementary', 'middle', 'high'],
    classSize: 'whole_class',
    effectiveness: 4
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
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Return the predefined activities
    // In a real application, these could be stored in the database
    // and customized per school or teacher preferences
    return NextResponse.json({ activities: interventionActivities })

  } catch (error) {
    console.error('Unexpected error in intervention activities API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
