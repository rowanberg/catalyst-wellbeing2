'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  Sword, 
  Shield, 
  Zap, 
  Heart, 
  Star, 
  Trophy, 
  Target,
  Flame,
  Crown,
  Sparkles,
  Lock,
  CheckCircle,
  ArrowRight,
  Home
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppSelector } from '@/lib/redux/hooks'

interface GameLevel {
  id: number
  name: string
  description: string
  monsters: Monster[]
  unlocked: boolean
  completed: boolean
  stars: number
  requiredLevel: number
  xpReward: number
  gemsReward: number
}

interface Monster {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  emoji: string
  weakness: string[]
  description: string
}

interface Player {
  level: number
  hp: number
  maxHp: number
  xp: number
  maxXp: number
  attack: number
  defense: number
  gems: number
  streak: number
  currentLevel: number
  completedLevels: number[]
}

interface Question {
  id: string
  question: string
  answer: number
  difficulty: number
  type: 'arithmetic' | 'algebra' | 'geometry'
  options?: number[]
}

// Enhanced level system with multiple levels and monsters
const GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    name: "Forest Clearing",
    description: "Face weak goblins in the peaceful forest",
    requiredLevel: 1,
    xpReward: 100,
    gemsReward: 20,
    unlocked: true,
    completed: false,
    stars: 0,
    monsters: [
      {
        id: 'goblin-scout',
        name: 'Goblin Scout',
        level: 1,
        hp: 30,
        maxHp: 30,
        attack: 5,
        defense: 1,
        emoji: '👹',
        weakness: ['fire'],
        description: 'A weak goblin perfect for beginners'
      },
      {
        id: 'goblin-warrior',
        name: 'Goblin Warrior',
        level: 1,
        hp: 45,
        maxHp: 45,
        attack: 8,
        defense: 2,
        emoji: '👺',
        weakness: ['fire', 'light'],
        description: 'A slightly stronger goblin with basic armor'
      }
    ]
  },
  {
    id: 2,
    name: "Dark Cave",
    description: "Venture into caves filled with stronger monsters",
    requiredLevel: 2,
    xpReward: 150,
    gemsReward: 30,
    unlocked: false,
    completed: false,
    stars: 0,
    monsters: [
      {
        id: 'cave-troll',
        name: 'Cave Troll',
        level: 2,
        hp: 70,
        maxHp: 70,
        attack: 12,
        defense: 4,
        emoji: '🧌',
        weakness: ['fire', 'lightning'],
        description: 'A hulking troll that guards the cave entrance'
      },
      {
        id: 'stone-ogre',
        name: 'Stone Ogre',
        level: 2,
        hp: 90,
        maxHp: 90,
        attack: 15,
        defense: 6,
        emoji: '👹',
        weakness: ['ice', 'lightning'],
        description: 'An ogre with stone-hard skin'
      }
    ]
  },
  {
    id: 3,
    name: "Mountain Peak",
    description: "Challenge fierce dragons at the mountain summit",
    requiredLevel: 3,
    xpReward: 200,
    gemsReward: 50,
    unlocked: false,
    completed: false,
    stars: 0,
    monsters: [
      {
        id: 'ice-dragon',
        name: 'Ice Dragon',
        level: 3,
        hp: 120,
        maxHp: 120,
        attack: 20,
        defense: 8,
        emoji: '🐲',
        weakness: ['fire'],
        description: 'A majestic dragon that breathes freezing ice'
      },
      {
        id: 'fire-dragon',
        name: 'Fire Dragon',
        level: 3,
        hp: 140,
        maxHp: 140,
        attack: 25,
        defense: 10,
        emoji: '🐉',
        weakness: ['ice', 'water'],
        description: 'A powerful dragon with scorching flames'
      }
    ]
  },
  {
    id: 4,
    name: "Shadow Realm",
    description: "Face the ultimate challenge against dark demons",
    requiredLevel: 4,
    xpReward: 300,
    gemsReward: 75,
    unlocked: false,
    completed: false,
    stars: 0,
    monsters: [
      {
        id: 'shadow-demon',
        name: 'Shadow Demon',
        level: 4,
        hp: 180,
        maxHp: 180,
        attack: 30,
        defense: 12,
        emoji: '😈',
        weakness: ['light', 'holy'],
        description: 'A terrifying demon from the shadow realm'
      },
      {
        id: 'demon-lord',
        name: 'Demon Lord',
        level: 5,
        hp: 250,
        maxHp: 250,
        attack: 40,
        defense: 15,
        emoji: '👿',
        weakness: ['light', 'holy'],
        description: 'The ultimate boss - master of all demons'
      }
    ]
  },
  {
    id: 5,
    name: "Crystal Caverns",
    description: "Explore mystical caverns with crystal guardians",
    requiredLevel: 5,
    xpReward: 400,
    gemsReward: 100,
    unlocked: false,
    completed: false,
    stars: 0,
    monsters: [
      {
        id: 'crystal-golem',
        name: 'Crystal Golem',
        level: 5,
        hp: 200,
        maxHp: 200,
        attack: 28,
        defense: 20,
        emoji: '💎',
        weakness: ['earth', 'sound'],
        description: 'A guardian made of pure crystal'
      },
      {
        id: 'gem-dragon',
        name: 'Gem Dragon',
        level: 6,
        hp: 300,
        maxHp: 300,
        attack: 45,
        defense: 18,
        emoji: '🐲',
        weakness: ['darkness'],
        description: 'A legendary dragon adorned with precious gems'
      }
    ]
  }
]

const generateQuestion = (type: string, difficulty: number): Question => {
  const questions: Record<string, () => Question> = {
    arithmetic: () => {
      const a = Math.floor(Math.random() * (10 * difficulty)) + 1
      const b = Math.floor(Math.random() * (10 * difficulty)) + 1
      const operations = ['+', '-', '*', '/']
      const op = operations[Math.floor(Math.random() * operations.length)]
      
      let question: string
      let answer: number
      
      switch (op) {
        case '+':
          question = `${a} + ${b}`
          answer = a + b
          break
        case '-':
          question = `${a + b} - ${b}`
          answer = a
          break
        case '*':
          question = `${a} × ${b}`
          answer = a * b
          break
        case '/':
          question = `${a * b} ÷ ${b}`
          answer = a
          break
        default:
          question = `${a} + ${b}`
          answer = a + b
      }
      
      return {
        id: Math.random().toString(),
        question,
        answer,
        difficulty,
        type: 'arithmetic'
      }
    },
    
    algebra: () => {
      const x = Math.floor(Math.random() * 10) + 1
      const a = Math.floor(Math.random() * 5) + 1
      const b = Math.floor(Math.random() * 20) + 1
      
      return {
        id: Math.random().toString(),
        question: `Solve for x: ${a}x + ${b} = ${a * x + b}`,
        answer: x,
        difficulty,
        type: 'algebra'
      }
    },
    
    geometry: () => {
      const shapes = [
        { name: 'square', sides: 4 },
        { name: 'triangle', sides: 3 },
        { name: 'pentagon', sides: 5 },
        { name: 'hexagon', sides: 6 }
      ]
      const shape = shapes[Math.floor(Math.random() * shapes.length)]
      
      return {
        id: Math.random().toString(),
        question: `How many sides does a ${shape.name} have?`,
        answer: shape.sides,
        difficulty,
        type: 'geometry'
      }
    }
  }
  
  return questions[type]?.() || questions.arithmetic()
}
export function MathBattleArena() {
  const { profile } = useAppSelector((state) => state.auth)
  const [gameState, setGameState] = useState<'menu' | 'levelSelect' | 'battle' | 'victory' | 'defeat' | 'levelComplete'>('menu')
  const [gameLevels, setGameLevels] = useState<GameLevel[]>(GAME_LEVELS)
  const [currentGameLevel, setCurrentGameLevel] = useState<GameLevel | null>(null)
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0)
  const [player, setPlayer] = useState<Player>({
    level: 1,
    hp: 100,
    maxHp: 100,
    xp: 0,
    maxXp: 1000,
    attack: 10,
    defense: 3,
    gems: 0,
    streak: 0,
    currentLevel: 1,
    completedLevels: []
  })
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [isAnswering, setIsAnswering] = useState(false)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [attackEffect, setAttackEffect] = useState<'player' | 'monster' | null>(null)
  const [damageNumbers, setDamageNumbers] = useState<Array<{id: number, damage: number, type: 'player' | 'monster'}>>([])
  const [shakeEffect, setShakeEffect] = useState<'player' | 'monster' | null>(null)

  // Database integration functions
  const saveProgress = async (levelId: number, completed: boolean, stars: number) => {
    if (!profile?.id) {
      throw new Error('No profile found')
    }

    console.log('Attempting to save progress:', {
      level_id: levelId,
      completed,
      stars,
      xp_earned: currentGameLevel?.xpReward || 0,
      gems_earned: currentGameLevel?.gemsReward || 0
    })

    try {
      const response = await fetch('/api/student/math-battle-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level_id: levelId,
          completed,
          stars,
          xp_earned: currentGameLevel?.xpReward || 0,
          gems_earned: currentGameLevel?.gemsReward || 0
        }),
      })

      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        let errorMsg = 'Failed to save progress'
        try {
          const errorData = await response.json()
          console.error('API Error response:', errorData)
          if (errorData?.error) errorMsg = errorData.error
        } catch {
          const text = await response.text()
          console.error('API Error text:', text)
          if (text) errorMsg = text
        }
        throw new Error(errorMsg)
      }

      const result = await response.json()
      console.log('Progress saved successfully:', result)
      
      return result
    } catch (error) {
      console.error('Error saving progress:', error)
      throw error
    }
  }

  const loadProgress = async () => {
    if (!profile?.id) return

    try {
      const response = await fetch('/api/student/math-battle-progress')
      if (response.ok) {
        const data = await response.json()
        const completedLevels = data.levels || []
        
        // Calculate total XP and gems earned from completed levels
        const totalXpEarned = completedLevels.reduce((sum: number, level: any) => sum + (level.xp_earned || 0), 0)
        const totalGemsEarned = completedLevels.reduce((sum: number, level: any) => sum + (level.gems_earned || 0), 0)
        
        // Update game levels with progress
        const updatedLevels = gameLevels.map(level => {
          const progress = completedLevels.find((p: any) => p.level_id === level.id)
          return {
            ...level,
            completed: !!progress,
            stars: progress?.stars || 0,
            unlocked: level.id === 1 || completedLevels.some((p: any) => p.level_id === level.id - 1)
          }
        })
        
        setGameLevels(updatedLevels)
        setPlayer(prev => ({
          ...prev,
          xp: totalXpEarned,
          gems: totalGemsEarned,
          completedLevels: completedLevels.map((p: any) => p.level_id)
        }))
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  useEffect(() => {
    loadProgress()
  }, [profile?.id])

  const timerRef = useRef<NodeJS.Timeout>()

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerActive) {
      handleWrongAnswer()
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeLeft, isTimerActive])

  const startBattle = (monsterId: string) => {
    // Find monster from current game level
    if (!currentGameLevel) return
    const monster = currentGameLevel.monsters.find(m => m.id === monsterId)
    if (!monster) return
    
    setCurrentMonster({ ...monster })
    setGameState('battle')
    setBattleLog([`A wild ${monster.name} appears! 🎯`])
    const question = generateQuestion('arithmetic', monster.level)
    setCurrentQuestion(question)
    setUserAnswer('')
    setTimeLeft(30)
    setIsTimerActive(true)
    setIsAnswering(true)
  }

  const startLevel = (level: GameLevel) => {
    if (!level.unlocked) {
      toast.error('Complete previous levels to unlock this one!')
      return
    }
    
    setCurrentGameLevel(level)
    setCurrentMonsterIndex(0)
    setCurrentMonster(level.monsters[0])
    const question = generateQuestion('arithmetic', level.monsters[0].level)
    setCurrentQuestion(question)
    setUserAnswer('')
    setGameState('battle')
    setBattleLog([])
    setCombo(0)
    setTimeLeft(30)
    setIsTimerActive(true)
    setIsAnswering(true)
  }
  const handleAnswer = () => {
    if (!currentQuestion || !currentMonster) return
    
    const answer = parseInt(userAnswer)
    setIsTimerActive(false)
    
    if (answer === currentQuestion.answer) {
      handleCorrectAnswer()
    } else {
      handleWrongAnswer()
    }
  }

  const handleCorrectAnswer = () => {
    if (!currentMonster || !currentQuestion) return
    
    const damage = Math.max(1, player.attack + combo * 2 - currentMonster.defense)
    const newMonsterHp = Math.max(0, currentMonster.hp - damage)
    
    // Trigger attack visual effects
    setAttackEffect('player')
    setShakeEffect('monster')
    
    // Add damage number animation
    const damageId = Date.now()
    setDamageNumbers(prev => [...prev, { id: damageId, damage, type: 'player' }])
    
    // Remove damage number after animation
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== damageId))
    }, 2000)
    
    // Clear effects
    setTimeout(() => {
      setAttackEffect(null)
      setShakeEffect(null)
    }, 800)
    
    setCurrentMonster(prev => prev ? { ...prev, hp: newMonsterHp } : null)
    setCombo(prev => prev + 1)
    
    setBattleLog(prev => [...prev, 
      `⚡ Critical Strike! ${damage} damage dealt!`,
      `${combo > 0 ? `🔥 Epic ${combo + 1}x Combo Multiplier!` : ''}`
    ])
    
    if (newMonsterHp <= 0) {
      handleVictory()
    } else {
      setTimeout(() => {
        monsterAttack()
      }, 1500)
    }
    
    setIsAnswering(false)
  }

  const handleWrongAnswer = () => {
    if (!currentMonster) return
    
    setCombo(0)
    setBattleLog(prev => [...prev, 
      `❌ Wrong answer! The correct answer was ${currentQuestion?.answer}`,
      `💥 Combo broken!`
    ])
    
    setTimeout(() => {
      monsterAttack()
    }, 1500)
    
    setIsAnswering(false)
  }

  const monsterAttack = () => {
    if (!currentMonster) return
    
    const damage = Math.max(1, currentMonster.attack - player.defense)
    const newPlayerHp = Math.max(0, player.hp - damage)
    
    // Trigger monster attack visual effects
    setAttackEffect('monster')
    setShakeEffect('player')
    
    // Add damage number animation
    const damageId = Date.now()
    setDamageNumbers(prev => [...prev, { id: damageId, damage, type: 'monster' }])
    
    // Remove damage number after animation
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== damageId))
    }, 2000)
    
    // Clear effects
    setTimeout(() => {
      setAttackEffect(null)
      setShakeEffect(null)
    }, 800)
    
    setPlayer(prev => ({ ...prev, hp: newPlayerHp }))
    setBattleLog(prev => [...prev, `💀 ${currentMonster.name} strikes back! ${damage} damage!`])
    
    if (newPlayerHp <= 0) {
      setGameState('defeat')
    } else {
      setTimeout(() => {
        const question = generateQuestion('arithmetic', currentMonster.level)
        setCurrentQuestion(question)
        setUserAnswer('')
        setTimeLeft(30)
        setIsTimerActive(true)
        setIsAnswering(true)
      }, 1500)
    }
  }

  const handleVictory = () => {
    if (!currentMonster || !currentGameLevel) return
    
    setBattleLog(prev => [...prev, 
      `🎯 ${currentMonster.name} defeated!`,
      combo > 5 ? `🏆 Amazing ${combo}x combo!` : ''
    ])
    
    // Check if there are more monsters in the current level
    if (currentMonsterIndex < currentGameLevel.monsters.length - 1) {
      // Move to next monster in the same level
      const nextMonster = currentGameLevel.monsters[currentMonsterIndex + 1]
      setCurrentMonsterIndex(prev => prev + 1)
      setCurrentMonster(nextMonster)
      
      setBattleLog(prev => [...prev, `⚔️ Next opponent: ${nextMonster.name} appears!`])
      
      // Generate new question for next monster
      setTimeout(() => {
        const question = generateQuestion('arithmetic', nextMonster.level)
        setCurrentQuestion(question)
        setUserAnswer('')
        setTimeLeft(30)
        setIsTimerActive(true)
        setIsAnswering(true)
      }, 2000)
    } else {
      // All monsters defeated - complete the level
      setBattleLog(prev => [...prev, `🏆 Level ${currentGameLevel.id} Complete!`])
      
      // Complete the level and save progress to database
      setTimeout(() => {
        completeLevel()
      }, 2000)
    }
  }

  const completeLevel = async () => {
    if (!currentGameLevel) return
    
    const stars = calculateStars()
    console.log(`Completing level ${currentGameLevel.id} with ${stars} stars`)
    
    try {
      // Save progress to database (this also updates student's total XP and gems)
      console.log(`Saving progress for level ${currentGameLevel.id}:`, {
        xp: currentGameLevel.xpReward,
        gems: currentGameLevel.gemsReward,
        stars
      })
      
      const result = await saveProgress(currentGameLevel.id, true, stars)
      console.log('Save progress result:', result)
      
      // Reload progress from database to ensure consistency
      await loadProgress()
      
      // Update local level state for immediate UI feedback
      const nextLevelId = currentGameLevel.id + 1
      const hasNextLevel = nextLevelId <= GAME_LEVELS.length
      
      setGameLevels(prev => {
        const updatedLevels = prev.map(level => {
          if (level.id === currentGameLevel.id) {
            return { ...level, completed: true, stars }
          }
          if (level.id === nextLevelId) {
            return { ...level, unlocked: true }
          }
          return level
        })
        console.log('Updated levels:', updatedLevels)
        return updatedLevels
      })
      
      // Show success message with earned rewards
      toast.success(`🎉 Level Complete! +${currentGameLevel.xpReward} XP, +${currentGameLevel.gemsReward} Gems!`)
      
      // Show victory screen first, then auto-redirect to next level
      setGameState('victory')
      
      // Auto-redirect to next level after 3 seconds if available
      if (hasNextLevel) {
        setTimeout(() => {
          const nextLevel = GAME_LEVELS.find(level => level.id === nextLevelId)
          if (nextLevel) {
            console.log(`Auto-starting next level: ${nextLevel.name}`)
            toast.success(`🚀 Starting Level ${nextLevelId}: ${nextLevel.name}!`)
            startLevel({ ...nextLevel, unlocked: true })
          }
        }, 3000)
      } else {
        // All levels completed
        setTimeout(() => {
          toast.success('🏆 Congratulations! You have mastered all levels!')
          setGameState('menu')
        }, 3000)
      }
    } catch (error) {
      console.error('Error completing level:', error)
      toast.error('Failed to save progress. Please try again.')
    }
  }
  
  const calculateStars = () => {
    if (combo >= 10) return 3
    if (combo >= 5) return 2
    return 1
  }

  const resetGame = () => {
    setGameState('menu')
    setCurrentMonster(null)
    setCurrentQuestion(null)
    setUserAnswer('')
    setBattleLog([])
    setCombo(0)
    setIsTimerActive(false)
    setPlayer(prev => ({ ...prev, hp: prev.maxHp }))
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-y-auto">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 p-4">
          <div className="max-w-6xl mx-auto pb-8">
            {/* Enhanced Header */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-yellow-600/20 backdrop-blur-xl rounded-3xl border border-white/10"></div>
                <div className="relative p-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="flex justify-center items-center space-x-4 mb-4"
                  >
                    <div className="p-4 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-2xl backdrop-blur-sm border border-red-400/30">
                      <Sword className="h-12 w-12 text-red-300" />
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-500 to-yellow-400 tracking-tight">
                      Math Battle Arena
                    </h1>
                  </motion.div>
                  
                  <motion.p 
                    className="text-lg sm:text-xl text-gray-300 font-medium max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    ⚔️ Defeat monsters with the power of mathematics! Master 5 epic levels!
                  </motion.p>
                </div>
              </div>
            </motion.div>

          {/* Player Stats - Enhanced Contrast */}
          <Card className="mb-8 bg-gray-800/80 border-gray-600/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white text-lg font-bold">
                <Crown className="h-6 w-6 text-yellow-400" />
                Player Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-700/50 rounded-lg border border-gray-600/30">
                  <div className="text-2xl font-bold text-yellow-300">Lv.{player.level}</div>
                  <div className="text-sm text-gray-200 font-medium">Level</div>
                </div>
                <div className="text-center p-3 bg-gray-700/50 rounded-lg border border-gray-600/30">
                  <div className="text-2xl font-bold text-red-300">{player.hp}/{player.maxHp}</div>
                  <div className="text-sm text-gray-200 font-medium">Health</div>
                </div>
                <div className="text-center p-3 bg-gray-700/50 rounded-lg border border-gray-600/30">
                  <div className="text-2xl font-bold text-blue-300">{player.attack}</div>
                  <div className="text-sm text-gray-200 font-medium">Attack</div>
                </div>
                <div className="text-center p-3 bg-gray-700/50 rounded-lg border border-gray-600/30">
                  <div className="text-2xl font-bold text-green-300">{player.gems}</div>
                  <div className="text-sm text-gray-200 font-medium">Total Gems</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
                <div className="flex justify-between text-sm text-gray-100 mb-2 font-medium">
                  <span>XP Progress</span>
                  <span className="text-blue-300">{player.xp}/{player.maxXp}</span>
                </div>
                <Progress value={(player.xp / player.maxXp) * 100} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Level Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameLevels.map((level, index) => (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                  level.unlocked 
                    ? 'bg-gray-800/90 border-orange-400/50 hover:border-orange-400/80 hover:scale-105 shadow-lg hover:shadow-orange-500/25' 
                    : 'bg-gray-900/80 border-gray-600/50 opacity-70'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl font-bold text-white bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                          #{level.id}
                        </div>
                        {level.completed && (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        )}
                        {!level.unlocked && (
                          <Lock className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      {level.completed && (
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < level.stars ? 'text-yellow-400 fill-current' : 'text-gray-500'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3">{level.name}</h3>
                    <p className="text-sm text-gray-200 mb-4 h-12 overflow-hidden leading-relaxed">{level.description}</p>
                    
                    <div className="flex items-center justify-between text-xs mb-4 p-2 bg-gray-700/40 rounded-lg">
                      <span className="text-gray-200 font-medium">Req. Level {level.requiredLevel}</span>
                      <span className="text-blue-300 font-medium">{level.xpReward} XP • {level.gemsReward} Gems</span>
                    </div>

                    <div className="flex space-x-2 mb-4 justify-center">
                      {level.monsters.slice(0, 3).map((monster, idx) => (
                        <div key={idx} className="text-3xl bg-gray-700/30 p-2 rounded-lg">{monster.emoji}</div>
                      ))}
                      {level.monsters.length > 3 && (
                        <div className="text-sm text-gray-200 flex items-center bg-gray-700/30 p-2 rounded-lg">
                          +{level.monsters.length - 3}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => startLevel(level)}
                      disabled={!level.unlocked}
                      className={`w-full font-semibold ${
                        level.unlocked
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {level.completed ? 'Play Again' : level.unlocked ? 'Start Battle' : 'Locked'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'battle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 relative overflow-y-auto">
        {/* Battle Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-red-500/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-orange-500/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-purple-500/30 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 p-4">
          <div className="max-w-4xl mx-auto pb-8">
          {/* Battle Header */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={resetGame} className="bg-gray-800/50">
              ← Back to Menu
            </Button>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Battle in Progress</h2>
              <div className="flex items-center gap-2 justify-center mt-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-lg text-orange-400">{combo}x Combo</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">⏰ {timeLeft}s</div>
            </div>
          </div>

          {/* Battle Arena */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Player Side - Enhanced with Visual Effects */}
            <motion.div
              animate={shakeEffect === 'player' ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Card className={`bg-gray-800/90 border-blue-400/60 shadow-lg relative ${
                attackEffect === 'player' ? 'ring-4 ring-blue-400/50' : ''
              }`}>
                {/* Attack Effect Overlay */}
                {attackEffect === 'player' && (
                  <div className="absolute inset-0 bg-blue-400/20 rounded-lg animate-pulse pointer-events-none" />
                )}
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-center text-white font-bold text-lg">🛡️ You (Lv.{player.level})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 bg-gray-700/40 rounded-lg relative">
                    <motion.div 
                      className="text-6xl mb-3 bg-gray-600/30 rounded-lg p-2 inline-block"
                      animate={attackEffect === 'player' ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.6 }}
                    >
                      🧙‍♂️
                    </motion.div>
                    
                    {/* Damage Numbers */}
                    {damageNumbers
                      .filter(d => d.type === 'monster')
                      .map(damage => (
                        <motion.div
                          key={damage.id}
                          className="absolute top-2 right-2 text-2xl font-bold text-red-400 pointer-events-none"
                          initial={{ opacity: 1, y: 0, scale: 1 }}
                          animate={{ opacity: 0, y: -50, scale: 1.5 }}
                          transition={{ duration: 2 }}
                        >
                          -{damage.damage}
                        </motion.div>
                      ))}
                    
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-200 mb-1 font-medium">
                      <span>Health</span>
                      <span className="text-green-300">{player.hp}/{player.maxHp}</span>
                    </div>
                    <Progress value={(player.hp / player.maxHp) * 100} className="h-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-600/50 p-2 rounded">
                      <div className="text-gray-200">Attack</div>
                      <div className="text-blue-300 font-bold">{player.attack}</div>
                    </div>
                    <div className="bg-gray-600/50 p-2 rounded">
                      <div className="text-gray-200">Defense</div>
                      <div className="text-green-300 font-bold">{player.defense}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Monster Side - Enhanced with Visual Effects */}
            <motion.div
              animate={shakeEffect === 'monster' ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Card className={`bg-gray-800/90 border-red-400/60 shadow-lg relative ${
                attackEffect === 'monster' ? 'ring-4 ring-red-400/50' : ''
              }`}>
                {/* Attack Effect Overlay */}
                {attackEffect === 'monster' && (
                  <div className="absolute inset-0 bg-red-400/20 rounded-lg animate-pulse pointer-events-none" />
                )}
              <CardHeader className="pb-3">
                <CardTitle className="text-center text-white font-bold text-lg">
                  ⚔️ {currentMonster?.name} (Lv.{currentMonster?.level})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 bg-gray-700/40 rounded-lg relative">
                  <motion.div 
                    className="text-6xl mb-3 bg-gray-600/30 rounded-lg p-2 inline-block"
                    animate={attackEffect === 'monster' ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    {currentMonster?.emoji}
                  </motion.div>
                  
                  {/* Damage Numbers */}
                  {damageNumbers
                    .filter(d => d.type === 'player')
                    .map(damage => (
                      <motion.div
                        key={damage.id}
                        className="absolute top-2 left-2 text-2xl font-bold text-green-400 pointer-events-none"
                        initial={{ opacity: 1, y: 0, scale: 1 }}
                        animate={{ opacity: 0, y: -50, scale: 1.5 }}
                        transition={{ duration: 2 }}
                      >
                        -{damage.damage}
                      </motion.div>
                    ))}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-200 mb-1 font-medium">
                      <span>Health</span>
                      <span className="text-red-300">
                        {currentMonster?.hp}/{currentMonster?.maxHp}
                      </span>
                    </div>
                    <Progress 
                      value={currentMonster ? (currentMonster.hp / currentMonster.maxHp) * 100 : 0} 
                      className="h-3" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-600/50 p-2 rounded">
                      <div className="text-gray-200">Attack</div>
                      <div className="text-red-300 font-bold">{currentMonster?.attack}</div>
                    </div>
                    <div className="bg-gray-600/50 p-2 rounded">
                      <div className="text-gray-200">Defense</div>
                      <div className="text-orange-300 font-bold">{currentMonster?.defense}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>

          {/* Question Section */}
          {currentQuestion && (
            <Card className="mb-6 bg-gray-800/90 border-purple-400/60 shadow-lg">
              <CardHeader>
                <CardTitle className="text-center text-white text-2xl font-bold">
                  🎯 Solve to Attack!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6 p-4 bg-gray-700/40 rounded-lg">
                  <div className="text-3xl font-bold text-white mb-4 bg-gray-600/30 p-3 rounded-lg">
                    {currentQuestion.question}
                  </div>
                  <div className="flex gap-4 justify-center items-center">
                    <Input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Your answer..."
                      className="text-center text-xl font-bold w-32 bg-gray-600/50 border-gray-500 text-white placeholder:text-gray-300"
                      onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
                      disabled={!isAnswering}
                    />
                    <Button 
                      onClick={handleAnswer}
                      disabled={!userAnswer || !isAnswering}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8 text-white font-bold shadow-lg"
                    >
                      ⚔️ Attack!
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Battle Log - Enhanced Contrast */}
          <Card className="bg-gray-800/90 border-gray-600/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white font-bold">📜 Battle Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 overflow-y-auto space-y-2 p-3 bg-gray-700/30 rounded-lg">
                {battleLog.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-gray-100 text-sm p-2 bg-gray-600/30 rounded border-l-2 border-blue-400/50 font-medium"
                  >
                    {log}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 relative overflow-y-auto">
        {/* Celebration Background Effects */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400/40 rounded-full blur-2xl animate-bounce"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-green-400/40 rounded-full blur-2xl animate-bounce delay-300"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-emerald-400/40 rounded-full blur-2xl animate-bounce delay-700"></div>
          <div className="absolute bottom-10 right-1/3 w-28 h-28 bg-teal-400/40 rounded-full blur-2xl animate-bounce delay-1000"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, -100],
                opacity: [1, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        <div className="relative z-10 p-4 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              type: "spring", 
              bounce: 0.4,
              staggerChildren: 0.2
            }}
            className="text-center max-w-lg mx-auto"
          >
            <Card className="bg-gray-900/95 border-2 border-green-400/60 shadow-2xl shadow-green-500/25 backdrop-blur-xl">
              <CardContent className="p-8">
                {/* Animated Trophy */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
                  className="relative mb-6"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-8xl relative"
                  >
                    🏆
                  </motion.div>
                  {/* Trophy Glow Effect */}
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
                </motion.div>

                {/* Title with Gradient */}
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-5xl font-black mb-4 bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent"
                >
                  LEVEL COMPLETE!
                </motion.h2>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-2xl text-white mb-6 font-bold"
                >
                  🎉 {currentGameLevel?.name} Conquered!
                </motion.p>

                {/* Enhanced Rewards Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                  className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 rounded-xl p-6 mb-6 border-2 border-green-400/30 shadow-lg"
                >
                  <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 mr-2" />
                    Rewards Earned
                    <Sparkles className="h-6 w-6 ml-2" />
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <motion.div 
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.1 }}
                      className="text-center p-4 bg-gradient-to-br from-blue-600/40 to-blue-500/40 rounded-lg border border-blue-400/50 shadow-md"
                    >
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-3xl font-black text-white mb-1"
                      >
                        +{currentGameLevel?.xpReward.toLocaleString()}
                      </motion.div>
                      <div className="text-sm text-blue-200 font-semibold">XP Points</div>
                      <div className="text-xs text-blue-300 mt-1">⚡ Experience</div>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.3 }}
                      className="text-center p-4 bg-gradient-to-br from-purple-600/40 to-purple-500/40 rounded-lg border border-purple-400/50 shadow-md"
                    >
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="text-3xl font-black text-white mb-1"
                      >
                        +{currentGameLevel?.gemsReward.toLocaleString()}
                      </motion.div>
                      <div className="text-sm text-purple-200 font-semibold">Gems</div>
                      <div className="text-xs text-purple-300 mt-1">💎 Currency</div>
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="text-center p-3 bg-green-600/20 rounded-lg border border-green-400/40"
                  >
                    <p className="text-green-200 font-bold flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Successfully Added to Your Account!
                      <CheckCircle className="h-5 w-5 ml-2" />
                    </p>
                  </motion.div>
                </motion.div>
              
              {/* Stars Display */}
              <div className="flex justify-center space-x-2 mb-6">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.2 + 0.5 }}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        i < calculateStars() ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
              
              <div className="space-y-4 mb-8">
                {battleLog.slice(-3).map((log, index) => (
                  <div key={index} className="text-lg text-gray-300">{log}</div>
                ))}
              </div>

              {/* Next Level Info */}
              {(() => {
                const nextLevelId = currentGameLevel ? currentGameLevel.id + 1 : 1
                const hasNextLevel = nextLevelId <= GAME_LEVELS.length
                const nextLevel = GAME_LEVELS.find(l => l.id === nextLevelId)
                
                return hasNextLevel ? (
                  <div className="bg-gray-700/60 rounded-lg p-4 mb-6 border border-blue-400/50">
                    <h3 className="text-lg font-semibold text-blue-200 mb-2">🚀 Next Adventure</h3>
                    <p className="text-white font-medium">Level {nextLevelId}: {nextLevel?.name}</p>
                    <p className="text-sm text-gray-200">{nextLevel?.description}</p>
                  </div>
                ) : (
                  <div className="bg-gray-700/60 rounded-lg p-4 mb-6 border border-yellow-400/50">
                    <h3 className="text-lg font-semibold text-yellow-200 mb-2">🎊 All Levels Complete!</h3>
                    <p className="text-white font-medium">You are a Math Battle Master!</p>
                  </div>
                )
              })()}

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={resetGame}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Menu
                </Button>
                {(() => {
                  const nextLevelId = currentGameLevel ? currentGameLevel.id + 1 : 1
                  const hasNextLevel = nextLevelId <= GAME_LEVELS.length
                  
                  return hasNextLevel ? (
                    <Button 
                      onClick={() => {
                        const nextLevel = GAME_LEVELS.find(level => level.id === nextLevelId)
                        if (nextLevel) {
                          toast.success(`🎉 Starting Level ${nextLevelId}: ${nextLevel.name}!`)
                          startLevel({ ...nextLevel, unlocked: true })
                        }
                      }}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Next Level
                    </Button>
                  ) : null
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        </div>
      </div>
    )
  }

  if (gameState === 'defeat') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black p-4 flex items-center justify-center overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-red-600/20 to-gray-600/20 border-red-400/30 p-8">
            <CardContent>
              <div className="text-8xl mb-6">💀</div>
              <h2 className="text-4xl font-bold text-red-400 mb-4">DEFEAT</h2>
              <p className="text-xl text-white mb-6">The {currentMonster?.name} was too strong...</p>
              <p className="text-lg text-gray-300 mb-8">Train harder and try again!</p>

              <Button 
                onClick={resetGame}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8"
              >
                🔄 Try Again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return null
}
