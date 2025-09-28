'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Zap, 
  Target, 
  Timer,
  Trophy,
  Star,
  Eye,
  Shuffle,
  Calculator,
  Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'

interface BrainExercise {
  id: string
  name: string
  category: 'memory' | 'attention' | 'logic' | 'speed'
  description: string
  icon: string
  difficulty: number
  duration: number
  instructions: string
}

interface BrainStats {
  level: number
  xp: number
  maxXp: number
  exercisesCompleted: number
  streak: number
  gems: number
  categories: {
    memory: number
    attention: number
    logic: number
    speed: number
  }
  personalBests: { [key: string]: number }
}

const BRAIN_EXERCISES: BrainExercise[] = [
  {
    id: '1',
    name: 'Memory Matrix',
    category: 'memory',
    description: 'Remember the pattern of highlighted squares',
    icon: '🧠',
    difficulty: 1,
    duration: 30,
    instructions: 'Watch the pattern, then recreate it by clicking the squares'
  },
  {
    id: '2',
    name: 'Color Focus',
    category: 'attention',
    description: 'Click only the specified color as fast as possible',
    icon: '🎯',
    difficulty: 2,
    duration: 45,
    instructions: 'Click circles of the target color, avoid other colors'
  },
  {
    id: '3',
    name: 'Number Sequence',
    category: 'logic',
    description: 'Find the pattern and complete the sequence',
    icon: '🔢',
    difficulty: 3,
    duration: 60,
    instructions: 'Analyze the number pattern and predict the next number'
  },
  {
    id: '4',
    name: 'Speed Math',
    category: 'speed',
    description: 'Solve math problems as quickly as possible',
    icon: '⚡',
    difficulty: 2,
    duration: 30,
    instructions: 'Answer math questions correctly and quickly'
  }
]

export function BrainTrainingGym() {
  const [gameState, setGameState] = useState<'menu' | 'exercise' | 'results'>('menu')
  const [brainStats, setBrainStats] = useState<BrainStats>({
    level: 1,
    xp: 0,
    maxXp: 180,
    exercisesCompleted: 0,
    streak: 0,
    gems: 0,
    categories: { memory: 0, attention: 0, logic: 0, speed: 0 },
    personalBests: {}
  })
  const [currentExercise, setCurrentExercise] = useState<BrainExercise | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [score, setScore] = useState(0)
  const [exerciseData, setExerciseData] = useState<any>(null)
  const [gamePhase, setGamePhase] = useState<'instructions' | 'playing' | 'finished'>('instructions')

  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      finishExercise()
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeLeft, isActive])

  const startExercise = (exerciseId: string) => {
    const exercise = BRAIN_EXERCISES.find(e => e.id === exerciseId)
    if (!exercise) return
    
    setCurrentExercise(exercise)
    setTimeLeft(exercise.duration)
    setScore(0)
    setGamePhase('instructions')
    setGameState('exercise')
    
    // Initialize exercise-specific data
    initializeExerciseData(exercise)
  }

  const initializeExerciseData = (exercise: BrainExercise) => {
    switch (exercise.id) {
      case '1': // Memory Matrix
        const pattern = generateMemoryPattern()
        setExerciseData({ pattern, userPattern: [], showPattern: true, gridSize: 4 })
        break
      case '2': // Color Focus
        setExerciseData({ 
          targetColor: getRandomColor(), 
          circles: generateColorCircles(),
          hits: 0,
          misses: 0
        })
        break
      case '3': // Number Sequence
        const sequence = generateNumberSequence()
        setExerciseData({ sequence, userAnswer: '', correctAnswer: sequence.next })
        break
      case '4': // Speed Math
        setExerciseData({ 
          currentProblem: generateMathProblem(),
          userAnswer: '',
          correctAnswers: 0,
          totalProblems: 0
        })
        break
    }
  }

  const generateMemoryPattern = () => {
    const pattern: Array<{row: number, col: number}> = []
    const gridSize = 4
    const patternLength = 6
    
    for (let i = 0; i < patternLength; i++) {
      const row = Math.floor(Math.random() * gridSize)
      const col = Math.floor(Math.random() * gridSize)
      if (!pattern.some(p => p.row === row && p.col === col)) {
        pattern.push({ row, col })
      }
    }
    return pattern
  }

  const getRandomColor = () => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const generateColorCircles = () => {
    const circles = []
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
    
    for (let i = 0; i < 12; i++) {
      circles.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      })
    }
    return circles
  }

  const generateNumberSequence = () => {
    const patterns = [
      { sequence: [2, 4, 6, 8], next: 10, rule: 'Add 2' },
      { sequence: [1, 3, 9, 27], next: 81, rule: 'Multiply by 3' },
      { sequence: [1, 4, 9, 16], next: 25, rule: 'Square numbers' },
      { sequence: [2, 6, 18, 54], next: 162, rule: 'Multiply by 3' }
    ]
    return patterns[Math.floor(Math.random() * patterns.length)]
  }

  const generateMathProblem = () => {
    const operations = ['+', '-', '*']
    const op = operations[Math.floor(Math.random() * operations.length)]
    let a, b, answer
    
    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 50) + 1
        b = Math.floor(Math.random() * 50) + 1
        answer = a + b
        break
      case '-':
        a = Math.floor(Math.random() * 50) + 25
        b = Math.floor(Math.random() * 25) + 1
        answer = a - b
        break
      case '*':
        a = Math.floor(Math.random() * 12) + 1
        b = Math.floor(Math.random() * 12) + 1
        answer = a * b
        break
      default:
        a = 1; b = 1; answer = 2
    }
    
    return { question: `${a} ${op} ${b}`, answer }
  }

  const beginExercise = () => {
    setGamePhase('playing')
    setIsActive(true)
    
    // Hide pattern for memory exercise after 3 seconds
    if (currentExercise?.id === '1') {
      setTimeout(() => {
        setExerciseData((prev: any) => ({ ...prev, showPattern: false }))
      }, 3000)
    }
  }

  const finishExercise = () => {
    setIsActive(false)
    setGamePhase('finished')
    
    // Calculate final score and update stats
    const finalScore = calculateFinalScore()
    setScore(finalScore)
    
    const xpGained = Math.floor(finalScore * (currentExercise?.difficulty || 1) * 2)
    const gemsEarned = Math.floor(xpGained / 10)
    
    setBrainStats(prev => {
      const newXp = prev.xp + xpGained
      const levelUp = newXp >= prev.maxXp
      const category = currentExercise?.category || 'memory'
      
      return {
        ...prev,
        xp: levelUp ? newXp - prev.maxXp : newXp,
        level: levelUp ? prev.level + 1 : prev.level,
        maxXp: levelUp ? prev.maxXp + 90 : prev.maxXp,
        exercisesCompleted: prev.exercisesCompleted + 1,
        streak: prev.streak + 1,
        gems: prev.gems + gemsEarned,
        categories: {
          ...prev.categories,
          [category]: prev.categories[category] + 1
        },
        personalBests: {
          ...prev.personalBests,
          [currentExercise?.id || '']: Math.max(prev.personalBests[currentExercise?.id || ''] || 0, finalScore)
        }
      }
    })
    
    setGameState('results')
    toast.success(`Exercise completed! +${xpGained} XP, +${gemsEarned} gems`)
  }

  const calculateFinalScore = () => {
    if (!currentExercise || !exerciseData) return 0
    
    switch (currentExercise.id) {
      case '1': // Memory Matrix
        const correctMatches = exerciseData.userPattern.filter((pos: any) =>
          exerciseData.pattern.some((p: any) => p.row === pos.row && p.col === pos.col)
        ).length
        return Math.floor((correctMatches / exerciseData.pattern.length) * 100)
      
      case '2': // Color Focus
        const accuracy = exerciseData.hits / (exerciseData.hits + exerciseData.misses) || 0
        return Math.floor(accuracy * 100)
      
      case '3': // Number Sequence
        return exerciseData.userAnswer == exerciseData.correctAnswer ? 100 : 0
      
      case '4': // Speed Math
        return Math.floor((exerciseData.correctAnswers / Math.max(exerciseData.totalProblems, 1)) * 100)
      
      default:
        return 0
    }
  }

  const resetToMenu = () => {
    setGameState('menu')
    setCurrentExercise(null)
    setIsActive(false)
    setExerciseData(null)
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 mb-4">
              🧠 Brain Training Gym
            </h1>
            <p className="text-xl text-gray-300">Exercise your mind and boost cognitive abilities!</p>
          </motion.div>

          {/* Brain Stats */}
          <Card className="mb-8 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Brain className="h-6 w-6 text-purple-400" />
                Brain Fitness Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">Lv.{brainStats.level}</div>
                  <div className="text-sm text-gray-300">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{brainStats.exercisesCompleted}</div>
                  <div className="text-sm text-gray-300">Exercises</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{brainStats.streak}</div>
                  <div className="text-sm text-gray-300">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {Object.values(brainStats.categories).reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="text-sm text-gray-300">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{brainStats.gems}</div>
                  <div className="text-sm text-gray-300">Gems</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Brain Power</span>
                  <span>{brainStats.xp}/{brainStats.maxXp}</span>
                </div>
                <Progress value={(brainStats.xp / brainStats.maxXp) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Category Stats */}
          <Card className="mb-8 bg-gradient-to-r from-indigo-600/20 to-blue-600/20 border-indigo-400/30">
            <CardHeader>
              <CardTitle className="text-white">Cognitive Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(brainStats.categories).map(([category, count]) => (
                  <div key={category} className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-2xl mb-2">
                      {category === 'memory' && '🧠'}
                      {category === 'attention' && '🎯'}
                      {category === 'logic' && '🔢'}
                      {category === 'speed' && '⚡'}
                    </div>
                    <div className="text-lg font-bold text-white">{count}</div>
                    <div className="text-sm text-gray-300 capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Exercises */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BRAIN_EXERCISES.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-400/30 hover:border-purple-400/60 transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        {exercise.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{exercise.name}</h3>
                        <p className="text-gray-300 text-sm mb-4">{exercise.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Category:</span>
                            <Badge variant="secondary" className="capitalize">
                              {exercise.category}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Duration:</span>
                            <span className="text-blue-400">{exercise.duration}s</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Difficulty:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < exercise.difficulty ? 'text-yellow-400 fill-current' : 'text-gray-500'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                          {brainStats.personalBests[exercise.id] && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300">Best Score:</span>
                              <span className="text-green-400">{brainStats.personalBests[exercise.id]}%</span>
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                          onClick={() => startExercise(exercise.id)}
                        >
                          🧠 Start Training
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'exercise') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={resetToMenu} className="bg-gray-800/50">
              ← Back to Gym
            </Button>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">{currentExercise?.name}</h2>
              <div className="text-lg text-purple-300">{currentExercise?.category.toUpperCase()}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                <Timer className="h-6 w-6 inline mr-2" />
                {timeLeft}s
              </div>
            </div>
          </div>

          {gamePhase === 'instructions' && (
            <Card className="mb-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/30">
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4">{currentExercise?.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4">Get Ready!</h3>
                <p className="text-lg text-gray-300 mb-6">{currentExercise?.instructions}</p>
                <Button 
                  onClick={beginExercise}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8 py-3 text-lg"
                >
                  🚀 Start Exercise
                </Button>
              </CardContent>
            </Card>
          )}

          {gamePhase === 'playing' && currentExercise && (
            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30">
              <CardContent className="p-6">
                {/* Exercise-specific content would go here */}
                <div className="text-center">
                  <div className="text-8xl mb-6">{currentExercise.icon}</div>
                  <div className="text-2xl font-bold text-white mb-4">
                    Exercise in Progress...
                  </div>
                  <div className="text-lg text-gray-300 mb-6">
                    Current Score: {score}%
                  </div>
                  <Button 
                    onClick={finishExercise}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  >
                    Finish Early
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (gameState === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-400/30 p-8">
            <CardContent>
              <div className="text-8xl mb-6">🏆</div>
              <h2 className="text-4xl font-bold text-green-400 mb-4">Training Complete!</h2>
              <p className="text-xl text-white mb-6">
                You completed {currentExercise?.name}!
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="text-3xl font-bold text-yellow-400">
                  Final Score: {score}%
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{brainStats.exercisesCompleted}</div>
                    <div className="text-sm text-gray-300">Total Exercises</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{brainStats.streak}</div>
                    <div className="text-sm text-gray-300">Current Streak</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={resetToMenu}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8"
                >
                  🏠 Back to Gym
                </Button>
                <Button 
                  onClick={() => {
                    const nextExercise = BRAIN_EXERCISES.find(e => parseInt(e.id) === parseInt(currentExercise?.id || '1') + 1)
                    if (nextExercise) {
                      startExercise(nextExercise.id)
                    } else {
                      resetToMenu()
                    }
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8"
                >
                  🧠 Next Exercise
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return null
}
