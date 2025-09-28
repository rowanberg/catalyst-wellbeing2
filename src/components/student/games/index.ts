// Premium Learning Games - Components are lazy loaded in GameLauncher
// Individual exports available if needed
export { MathBattleArena } from './MathBattleArena'
export { WordWizardAcademy } from './WordWizardAcademy'
export { ScienceLabSimulator } from './ScienceLabSimulator'
export { HistoryTimeMachine } from './HistoryTimeMachine'
export { CodeQuestAdventures } from './CodeQuestAdventures'
export { GeographyExplorer } from './GeographyExplorer'
export { BrainTrainingGym } from './BrainTrainingGym'

// Main launcher component
export { GameLauncher } from './GameLauncher'

// Game metadata for the launcher
export const PREMIUM_GAMES = [
  {
    id: 'math-battle-arena',
    name: 'Math Battle Arena',
    description: 'Epic math battles with monsters and RPG elements',
    category: 'Mathematics',
    difficulty: 'Beginner to Advanced',
    duration: '15-20 min',
    xpReward: '150-200 XP',
    gemReward: '30-50 gems',
    emoji: '🐉',
    color: 'from-red-600 to-orange-600',
    component: 'MathBattleArena',
    features: ['RPG Combat', 'Level Progression', 'Combo System', 'Monster Battles'],
    subjects: ['Arithmetic', 'Algebra', 'Geometry'],
    ageRange: '8-16 years'
  },
  {
    id: 'word-wizard-academy',
    name: 'Word Wizard Academy',
    description: 'Magical spelling and vocabulary building adventure',
    category: 'Language Arts',
    difficulty: 'Beginner to Intermediate',
    duration: '20-25 min',
    xpReward: '120-180 XP',
    gemReward: '25-40 gems',
    emoji: '🧙‍♂️',
    color: 'from-purple-600 to-indigo-600',
    component: 'WordWizardAcademy',
    features: ['Spell Casting', 'Chapter System', 'Vocabulary Building', 'Mana Mechanics'],
    subjects: ['Spelling', 'Vocabulary', 'Word Recognition'],
    ageRange: '7-14 years'
  },
  {
    id: 'science-lab-simulator',
    name: 'Science Lab Simulator',
    description: 'Virtual chemistry and physics experiments',
    category: 'Science',
    difficulty: 'Intermediate to Advanced',
    duration: '25-30 min',
    xpReward: '180-250 XP',
    gemReward: '35-60 gems',
    emoji: '🔬',
    color: 'from-teal-600 to-blue-600',
    component: 'ScienceLabSimulator',
    features: ['Virtual Experiments', 'Safety Protocols', 'Real Science', 'Lab Equipment'],
    subjects: ['Chemistry', 'Physics', 'Scientific Method'],
    ageRange: '10-16 years'
  },
  {
    id: 'history-time-machine',
    name: 'History Time Machine',
    description: 'Time travel through historical periods',
    category: 'History',
    difficulty: 'Intermediate',
    duration: '20-30 min',
    xpReward: '160-220 XP',
    gemReward: '30-45 gems',
    emoji: '⏰',
    color: 'from-amber-600 to-orange-600',
    component: 'HistoryTimeMachine',
    features: ['Time Travel', 'Historical Scenarios', 'Artifact Collection', 'Cultural Learning'],
    subjects: ['World History', 'Ancient Civilizations', 'Cultural Studies'],
    ageRange: '9-15 years'
  },
  {
    id: 'code-quest-adventures',
    name: 'Code Quest Adventures',
    description: 'Learn programming through epic coding quests',
    category: 'Computer Science',
    difficulty: 'Beginner to Intermediate',
    duration: '15-25 min',
    xpReward: '140-200 XP',
    gemReward: '25-50 gems',
    emoji: '💻',
    color: 'from-green-600 to-blue-600',
    component: 'CodeQuestAdventures',
    features: ['Code Editor', 'Programming Challenges', 'Test Cases', 'Debugging'],
    subjects: ['Python Programming', 'Logic', 'Problem Solving'],
    ageRange: '10-16 years'
  },
  {
    id: 'geography-explorer',
    name: 'Geography Explorer',
    description: 'Virtual world expeditions and exploration',
    category: 'Geography',
    difficulty: 'Beginner to Intermediate',
    duration: '18-25 min',
    xpReward: '130-190 XP',
    gemReward: '20-40 gems',
    emoji: '🌍',
    color: 'from-teal-600 to-green-600',
    component: 'GeographyExplorer',
    features: ['World Exploration', 'Photo Collection', 'Geography Quizzes', 'Cultural Facts'],
    subjects: ['World Geography', 'Cultures', 'Climate', 'Landmarks'],
    ageRange: '8-14 years'
  },
  {
    id: 'brain-training-gym',
    name: 'Brain Training Gym',
    description: 'Cognitive skills and mental fitness training',
    category: 'Cognitive Skills',
    difficulty: 'All Levels',
    duration: '10-20 min',
    xpReward: '100-160 XP',
    gemReward: '15-35 gems',
    emoji: '🧠',
    color: 'from-purple-600 to-pink-600',
    component: 'BrainTrainingGym',
    features: ['Memory Training', 'Attention Focus', 'Logic Puzzles', 'Speed Challenges'],
    subjects: ['Memory', 'Attention', 'Logic', 'Processing Speed'],
    ageRange: '6-16 years'
  }
]

// Game categories for filtering
export const GAME_CATEGORIES = [
  'All Games',
  'Mathematics',
  'Language Arts', 
  'Science',
  'History',
  'Computer Science',
  'Geography',
  'Cognitive Skills'
]

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  'All Levels',
  'Beginner',
  'Intermediate', 
  'Advanced'
]
