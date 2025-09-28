import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This endpoint seeds the database with 7 highly engaging educational games
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

    // Get authenticated user (admin only)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Define 7 highly engaging educational games
    const games = [
      {
        title: 'Math Battle Arena',
        description: 'Epic math battles where students solve equations to defeat monsters and level up their mathematical powers!',
        game_type: 'math_challenge',
        subject: 'Mathematics',
        topic: 'Arithmetic & Algebra',
        grade_levels: ['6', '7', '8', '9', '10'],
        difficulty_level: 3,
        learning_objectives: [
          'Master basic arithmetic operations',
          'Solve linear equations',
          'Apply order of operations',
          'Build mental math speed'
        ],
        game_config: {
          battle_system: true,
          monster_types: ['Algebra Dragon', 'Fraction Goblin', 'Decimal Demon', 'Geometry Giant'],
          power_ups: ['Double Damage', 'Time Freeze', 'Auto Solve', 'Shield'],
          levels: 50,
          boss_battles: [10, 25, 40, 50],
          multiplayer_mode: true,
          leaderboards: true,
          achievements: ['First Victory', 'Speed Demon', 'Perfect Score', 'Boss Slayer']
        },
        max_score: 1000,
        passing_score: 600,
        time_limit_seconds: 300,
        xp_reward: 150,
        gem_reward: 30,
        bonus_multipliers: {
          perfect_score: 2.0,
          speed_bonus: 1.5,
          streak_bonus: 1.8,
          boss_defeat: 3.0
        },
        thumbnail_url: '🐉',
        estimated_duration_minutes: 15,
        tags: ['math', 'battle', 'rpg', 'multiplayer', 'competitive'],
        is_featured: true
      },
      {
        title: 'Word Wizard Academy',
        description: 'Cast spelling spells and build vocabulary magic in this enchanting word-building adventure!',
        game_type: 'word_puzzle',
        subject: 'English',
        topic: 'Vocabulary & Spelling',
        grade_levels: ['5', '6', '7', '8', '9'],
        difficulty_level: 2,
        learning_objectives: [
          'Expand vocabulary knowledge',
          'Improve spelling accuracy',
          'Learn word etymology',
          'Practice creative writing'
        ],
        game_config: {
          spell_system: true,
          word_categories: ['Academic', 'Science', 'Literature', 'History', 'Arts'],
          magic_spells: ['Anagram Blast', 'Synonym Shield', 'Definition Detector', 'Etymology Explosion'],
          story_mode: true,
          chapters: 12,
          character_customization: true,
          spell_book: true,
          daily_challenges: true
        },
        max_score: 800,
        passing_score: 480,
        time_limit_seconds: 600,
        xp_reward: 120,
        gem_reward: 25,
        bonus_multipliers: {
          perfect_spelling: 2.5,
          creative_bonus: 1.7,
          speed_bonus: 1.3
        },
        thumbnail_url: '🧙‍♂️',
        estimated_duration_minutes: 20,
        tags: ['vocabulary', 'spelling', 'magic', 'story', 'creative'],
        is_featured: true
      },
      {
        title: 'Science Lab Simulator',
        description: 'Conduct virtual experiments, discover scientific principles, and become a master scientist!',
        game_type: 'simulation',
        subject: 'Science',
        topic: 'Chemistry & Physics',
        grade_levels: ['8', '9', '10', '11', '12'],
        difficulty_level: 4,
        learning_objectives: [
          'Understand scientific method',
          'Learn chemical reactions',
          'Explore physics principles',
          'Practice lab safety'
        ],
        game_config: {
          virtual_lab: true,
          experiments: [
            'Chemical Reactions', 'Electricity & Magnetism', 'Optics', 'Thermodynamics',
            'Atomic Structure', 'Periodic Table', 'Genetics', 'Ecology'
          ],
          equipment: ['Microscope', 'Bunsen Burner', 'Test Tubes', 'pH Meter', 'Voltmeter'],
          safety_protocols: true,
          hypothesis_testing: true,
          data_analysis: true,
          lab_reports: true,
          collaboration_mode: true
        },
        max_score: 1200,
        passing_score: 720,
        time_limit_seconds: 1800,
        xp_reward: 200,
        gem_reward: 40,
        bonus_multipliers: {
          hypothesis_accuracy: 2.2,
          safety_compliance: 1.5,
          data_precision: 1.8
        },
        thumbnail_url: '🔬',
        estimated_duration_minutes: 30,
        tags: ['science', 'experiments', 'simulation', 'lab', 'discovery'],
        is_featured: true
      },
      {
        title: 'History Time Machine',
        description: 'Travel through time, meet historical figures, and shape the course of history in this immersive adventure!',
        game_type: 'adventure',
        subject: 'History',
        topic: 'World History',
        grade_levels: ['7', '8', '9', '10', '11'],
        difficulty_level: 3,
        learning_objectives: [
          'Learn major historical events',
          'Understand cause and effect',
          'Explore different cultures',
          'Develop critical thinking'
        ],
        game_config: {
          time_periods: [
            'Ancient Egypt', 'Greek Empire', 'Roman Empire', 'Medieval Times',
            'Renaissance', 'Industrial Revolution', 'World Wars', 'Modern Era'
          ],
          historical_figures: [
            'Cleopatra', 'Alexander the Great', 'Leonardo da Vinci', 'Napoleon',
            'Abraham Lincoln', 'Marie Curie', 'Gandhi', 'Martin Luther King Jr.'
          ],
          interactive_events: true,
          decision_making: true,
          alternate_timelines: true,
          artifact_collection: true,
          museum_mode: true
        },
        max_score: 900,
        passing_score: 540,
        time_limit_seconds: 1200,
        xp_reward: 160,
        gem_reward: 35,
        bonus_multipliers: {
          historical_accuracy: 2.0,
          timeline_mastery: 1.6,
          cultural_understanding: 1.4
        },
        thumbnail_url: '⏰',
        estimated_duration_minutes: 25,
        tags: ['history', 'time-travel', 'adventure', 'culture', 'decision-making'],
        is_featured: true
      },
      {
        title: 'Code Quest Adventures',
        description: 'Learn programming through epic quests! Solve coding challenges to unlock new worlds and abilities.',
        game_type: 'puzzle',
        subject: 'Computer Science',
        topic: 'Programming Fundamentals',
        grade_levels: ['8', '9', '10', '11', '12'],
        difficulty_level: 4,
        learning_objectives: [
          'Learn programming logic',
          'Understand algorithms',
          'Practice problem solving',
          'Build computational thinking'
        ],
        game_config: {
          programming_languages: ['Python', 'JavaScript', 'Scratch'],
          quest_types: ['Bug Hunt', 'Algorithm Race', 'Logic Puzzle', 'Code Golf'],
          worlds: ['Binary Forest', 'Loop Lake', 'Function Falls', 'Array Mountains'],
          coding_challenges: 100,
          hint_system: true,
          code_editor: true,
          visual_programming: true,
          peer_code_review: true,
          project_showcase: true
        },
        max_score: 1500,
        passing_score: 900,
        time_limit_seconds: 2400,
        xp_reward: 250,
        gem_reward: 50,
        bonus_multipliers: {
          elegant_solution: 2.5,
          efficiency_bonus: 2.0,
          creativity_bonus: 1.8
        },
        thumbnail_url: '💻',
        estimated_duration_minutes: 40,
        tags: ['coding', 'programming', 'logic', 'problem-solving', 'technology'],
        is_featured: true
      },
      {
        title: 'Geography Explorer',
        description: 'Explore the world, discover countries, and master geography through exciting virtual expeditions!',
        game_type: 'adventure',
        subject: 'Geography',
        topic: 'World Geography',
        grade_levels: ['6', '7', '8', '9', '10'],
        difficulty_level: 2,
        learning_objectives: [
          'Learn world countries and capitals',
          'Understand climate and terrain',
          'Explore cultural diversity',
          'Study natural resources'
        ],
        game_config: {
          exploration_mode: true,
          continents: ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Australia', 'Antarctica'],
          challenges: ['Capital Quiz', 'Flag Match', 'Landmark Hunt', 'Climate Detective'],
          virtual_tours: true,
          photo_challenges: true,
          cultural_facts: true,
          expedition_journal: true,
          team_expeditions: true,
          achievement_badges: ['World Traveler', 'Culture Expert', 'Geography Master']
        },
        max_score: 700,
        passing_score: 420,
        time_limit_seconds: 900,
        xp_reward: 130,
        gem_reward: 28,
        bonus_multipliers: {
          exploration_bonus: 1.8,
          cultural_knowledge: 1.5,
          speed_explorer: 1.3
        },
        thumbnail_url: '🌍',
        estimated_duration_minutes: 18,
        tags: ['geography', 'exploration', 'culture', 'world', 'adventure'],
        is_featured: true
      },
      {
        title: 'Brain Training Gym',
        description: 'Exercise your mind with cognitive challenges that boost memory, attention, and problem-solving skills!',
        game_type: 'memory_game',
        subject: 'Cognitive Skills',
        topic: 'Mental Fitness',
        grade_levels: ['5', '6', '7', '8', '9', '10', '11', '12'],
        difficulty_level: 3,
        learning_objectives: [
          'Improve working memory',
          'Enhance attention span',
          'Boost processing speed',
          'Develop pattern recognition'
        ],
        game_config: {
          training_modules: [
            'Memory Palace', 'Attention Focus', 'Pattern Matrix', 'Speed Processing',
            'Logic Chains', 'Spatial Reasoning', 'Number Sequences', 'Visual Tracking'
          ],
          adaptive_difficulty: true,
          progress_tracking: true,
          brain_age_calculator: true,
          daily_workouts: true,
          cognitive_assessments: true,
          personalized_training: true,
          social_challenges: true,
          brain_fitness_reports: true
        },
        max_score: 1000,
        passing_score: 600,
        time_limit_seconds: 600,
        xp_reward: 140,
        gem_reward: 30,
        bonus_multipliers: {
          consistency_bonus: 2.0,
          improvement_rate: 1.7,
          perfect_focus: 1.5
        },
        thumbnail_url: '🧠',
        estimated_duration_minutes: 15,
        tags: ['memory', 'cognitive', 'brain-training', 'focus', 'mental-fitness'],
        is_featured: true
      }
    ]

    // Insert games into database
    const insertedGames = []
    for (const game of games) {
      const { data: insertedGame, error } = await supabase
        .from('learning_games')
        .insert({
          school_id: profile.school_id,
          created_by: profile.id,
          ...game
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting game:', error)
        continue
      }

      insertedGames.push(insertedGame)
    }

    return NextResponse.json({ 
      message: `Successfully created ${insertedGames.length} engaging learning games!`,
      games: insertedGames 
    })

  } catch (error) {
    console.error('Seed games API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
