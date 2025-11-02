'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  MapPin, 
  Users, 
  Crown,
  Scroll,
  Sword,
  Castle,
  Globe,
  Star,
  Trophy,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'

interface TimePeriod {
  id: string
  name: string
  era: string
  year: string
  description: string
  emoji: string
  color: string
  scenarios: Scenario[]
  artifacts: Artifact[]
  unlocked: boolean
}

interface Scenario {
  id: string
  title: string
  description: string
  character: string
  choices: Choice[]
  historicalContext: string
  learningPoints: string[]
}

interface Choice {
  id: string
  text: string
  consequence: string
  historicalAccuracy: number
  xpReward: number
  artifactReward?: string
}

interface Artifact {
  id: string
  name: string
  description: string
  period: string
  rarity: 'common' | 'rare' | 'legendary'
  emoji: string
}

interface TimelineStats {
  level: number
  xp: number
  maxXp: number
  periodsVisited: number
  artifactsCollected: number
  historicalAccuracy: number
  gems: number
  timelineProgress: number
}

const TIME_PERIODS: TimePeriod[] = [
  {
    id: '1',
    name: 'Ancient Egypt',
    era: 'Ancient World',
    year: '3100 BCE',
    description: 'Journey to the land of pharaohs, pyramids, and the mighty Nile River',
    emoji: '🏺',
    color: 'from-yellow-600 to-orange-600',
    unlocked: true,
    scenarios: [
      {
        id: 'egypt1',
        title: 'The Great Pyramid Construction',
        description: 'You are an architect helping to build the Great Pyramid of Giza',
        character: 'Royal Architect Hemiunu',
        historicalContext: 'The Great Pyramid was built around 2580-2560 BCE during the Fourth Dynasty',
        learningPoints: [
          'Ancient Egyptian engineering was incredibly advanced',
          'Pyramids were tombs for pharaohs',
          'Construction required precise mathematical calculations'
        ],
        choices: [
          {
            id: 'c1',
            text: 'Use copper tools and wooden ramps',
            consequence: 'Historically accurate! Construction proceeds efficiently.',
            historicalAccuracy: 100,
            xpReward: 50,
            artifactReward: 'copper_chisel'
          },
          {
            id: 'c2',
            text: 'Use iron tools (not invented yet)',
            consequence: 'Anachronistic choice. Iron Age hasn\'t begun yet.',
            historicalAccuracy: 20,
            xpReward: 10
          }
        ]
      }
    ],
    artifacts: [
      {
        id: 'copper_chisel',
        name: 'Ancient Copper Chisel',
        description: 'A tool used by pyramid builders',
        period: 'Ancient Egypt',
        rarity: 'common',
        emoji: '🔨'
      }
    ]
  },
  {
    id: '2',
    name: 'Medieval Europe',
    era: 'Middle Ages',
    year: '1200 CE',
    description: 'Enter the age of knights, castles, and feudalism',
    emoji: '🏰',
    color: 'from-gray-600 to-blue-600',
    unlocked: true,
    scenarios: [
      {
        id: 'medieval1',
        title: 'The Crusader\'s Dilemma',
        description: 'You are a knight deciding whether to join the Third Crusade',
        character: 'Sir William of Normandy',
        historicalContext: 'The Third Crusade (1189-1192) was led by Richard the Lionheart',
        learningPoints: [
          'The Crusades were religious wars between Christians and Muslims',
          'They had lasting impacts on trade and culture',
          'Knights followed a code of chivalry'
        ],
        choices: [
          {
            id: 'c1',
            text: 'Join the crusade for religious duty',
            consequence: 'You follow the medieval mindset of religious warfare.',
            historicalAccuracy: 90,
            xpReward: 45,
            artifactReward: 'crusader_sword'
          },
          {
            id: 'c2',
            text: 'Stay home to protect your lands',
            consequence: 'A practical choice many knights made.',
            historicalAccuracy: 80,
            xpReward: 35
          }
        ]
      }
    ],
    artifacts: [
      {
        id: 'crusader_sword',
        name: 'Crusader\'s Longsword',
        description: 'A blessed blade carried in the Holy Land',
        period: 'Medieval Europe',
        rarity: 'rare',
        emoji: '⚔️'
      }
    ]
  },
  {
    id: '3',
    name: 'Renaissance Italy',
    era: 'Renaissance',
    year: '1500 CE',
    description: 'Experience the rebirth of art, science, and learning',
    emoji: '🎨',
    color: 'from-purple-600 to-pink-600',
    unlocked: true,
    scenarios: [
      {
        id: 'renaissance1',
        title: 'Leonardo\'s Workshop',
        description: 'You are an apprentice in Leonardo da Vinci\'s workshop',
        character: 'Giovanni, Art Apprentice',
        historicalContext: 'Leonardo da Vinci (1452-1519) was the ultimate Renaissance man',
        learningPoints: [
          'The Renaissance emphasized humanism and individual achievement',
          'Art and science were closely connected',
          'Patronage system supported artists'
        ],
        choices: [
          {
            id: 'c1',
            text: 'Study human anatomy through dissection',
            consequence: 'You advance both art and medical knowledge!',
            historicalAccuracy: 95,
            xpReward: 60,
            artifactReward: 'anatomical_sketch'
          },
          {
            id: 'c2',
            text: 'Focus only on painting techniques',
            consequence: 'You become skilled but miss the broader learning.',
            historicalAccuracy: 70,
            xpReward: 30
          }
        ]
      }
    ],
    artifacts: [
      {
        id: 'anatomical_sketch',
        name: 'Leonardo\'s Anatomical Sketch',
        description: 'A detailed study of human anatomy',
        period: 'Renaissance Italy',
        rarity: 'legendary',
        emoji: '📜'
      }
    ]
  }
]

export function HistoryTimeMachine() {
  const [gameState, setGameState] = useState<'menu' | 'timeline' | 'scenario' | 'results'>('menu')
  const [timelineStats, setTimelineStats] = useState<TimelineStats>({
    level: 1,
    xp: 0,
    maxXp: 160,
    periodsVisited: 0,
    artifactsCollected: 0,
    historicalAccuracy: 0,
    gems: 0,
    timelineProgress: 0
  })
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>(TIME_PERIODS)
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod | null>(null)
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null)
  const [collectedArtifacts, setCollectedArtifacts] = useState<Artifact[]>([])
  const [scenarioResults, setScenarioResults] = useState<{
    choice: Choice
    accuracy: number
    xp: number
  } | null>(null)

  const enterTimePeriod = (periodId: string) => {
    const period = timePeriods.find(p => p.id === periodId)
    if (!period || !period.unlocked) return
    
    setCurrentPeriod(period)
    setGameState('timeline')
  }

  const startScenario = (scenarioId: string) => {
    if (!currentPeriod) return
    
    const scenario = currentPeriod.scenarios.find(s => s.id === scenarioId)
    if (!scenario) return
    
    setCurrentScenario(scenario)
    setGameState('scenario')
  }

  const makeChoice = (choice: Choice) => {
    if (!currentScenario || !currentPeriod) return
    
    const xpGained = choice.xpReward
    const accuracyScore = choice.historicalAccuracy
    
    setTimelineStats(prev => {
      const newXp = prev.xp + xpGained
      const levelUp = newXp >= prev.maxXp
      const newAccuracy = Math.floor((prev.historicalAccuracy + accuracyScore) / 2)
      
      return {
        ...prev,
        xp: levelUp ? newXp - prev.maxXp : newXp,
        level: levelUp ? prev.level + 1 : prev.level,
        maxXp: levelUp ? prev.maxXp + 80 : prev.maxXp,
        historicalAccuracy: newAccuracy,
        gems: prev.gems + Math.floor(accuracyScore / 20),
        timelineProgress: prev.timelineProgress + 1
      }
    })
    
    // Collect artifact if rewarded
    if (choice.artifactReward) {
      const artifact = currentPeriod.artifacts.find(a => a.id === choice.artifactReward)
      if (artifact && !collectedArtifacts.find(a => a.id === artifact.id)) {
        setCollectedArtifacts(prev => [...prev, artifact])
        setTimelineStats(prev => ({ ...prev, artifactsCollected: prev.artifactsCollected + 1 }))
        toast.success(`Artifact discovered: ${artifact.name}!`)
      }
    }
    
    setScenarioResults({
      choice,
      accuracy: accuracyScore,
      xp: xpGained
    })
    
    setGameState('results')
    
    // Unlock next period if this was the first visit
    if (!timePeriods.find(p => p.id === currentPeriod.id)?.scenarios.some(s => s.id === currentScenario.id)) {
      const nextPeriodId = (parseInt(currentPeriod.id) + 1).toString()
      setTimePeriods(prev => prev.map(period => 
        period.id === nextPeriodId ? { ...period, unlocked: true } : period
      ))
      setTimelineStats(prev => ({ ...prev, periodsVisited: prev.periodsVisited + 1 }))
    }
  }

  const resetToMenu = () => {
    setGameState('menu')
    setCurrentPeriod(null)
    setCurrentScenario(null)
    setScenarioResults(null)
  }

  const backToTimeline = () => {
    setGameState('timeline')
    setCurrentScenario(null)
    setScenarioResults(null)
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 mb-4">
              ⏰ History Time Machine
            </h1>
            <p className="text-xl text-gray-300">Travel through time and experience history firsthand!</p>
          </motion.div>

          {/* Timeline Stats */}
          <Card className="mb-8 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-6 w-6 text-purple-400" />
                Time Traveler Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">Lv.{timelineStats.level}</div>
                  <div className="text-sm text-gray-300">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{timelineStats.periodsVisited}</div>
                  <div className="text-sm text-gray-300">Periods</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{timelineStats.artifactsCollected}</div>
                  <div className="text-sm text-gray-300">Artifacts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{timelineStats.historicalAccuracy}%</div>
                  <div className="text-sm text-gray-300">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{timelineStats.gems}</div>
                  <div className="text-sm text-gray-300">Gems</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Timeline Progress</span>
                  <span>{timelineStats.xp}/{timelineStats.maxXp}</span>
                </div>
                <Progress value={(timelineStats.xp / timelineStats.maxXp) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Time Periods */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timePeriods.map((period, index) => (
              <motion.div
                key={period.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${
                  period.unlocked
                    ? `bg-gradient-to-br ${period.color}/20 border-opacity-30 hover:border-opacity-60`
                    : 'bg-gradient-to-br from-gray-600/20 to-gray-700/20 border-gray-500/30'
                } transition-all cursor-pointer group`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                      {period.unlocked ? period.emoji : '🔒'}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{period.name}</h3>
                    <p className="text-sm text-gray-300 mb-2">{period.era}</p>
                    <p className="text-xs text-gray-400 mb-4">{period.year}</p>
                    <p className="text-sm text-gray-300 mb-4">{period.description}</p>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between text-gray-300">
                        <span>Scenarios:</span>
                        <span className="text-purple-400">{period.scenarios.length}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Artifacts:</span>
                        <span className="text-yellow-400">{period.artifacts.length}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className={`w-full bg-gradient-to-r ${period.color} hover:opacity-90`}
                      onClick={() => enterTimePeriod(period.id)}
                      disabled={!period.unlocked}
                    >
                      {period.unlocked ? '⏰ Time Travel' : '🔒 Locked'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Artifact Collection */}
          {collectedArtifacts.length > 0 && (
            <Card className="mt-8 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-400/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  Artifact Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {collectedArtifacts.map((artifact, index) => (
                    <motion.div
                      key={artifact.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="text-3xl mb-2">{artifact.emoji}</div>
                      <div className="text-sm font-semibold text-white">{artifact.name}</div>
                      <Badge 
                        variant={artifact.rarity === 'legendary' ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {artifact.rarity}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (gameState === 'timeline') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentPeriod?.color} p-3 sm:p-4`}>
        <div className="max-w-4xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6">
            <Button variant="outline" onClick={resetToMenu} className="w-full sm:w-auto bg-gray-800/50 h-10">
              <span className="text-sm sm:text-base">← Back to Time Machine</span>
            </Button>
            <div className="text-center flex-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{currentPeriod?.name}</h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-200">{currentPeriod?.era} • {currentPeriod?.year}</p>
            </div>
            <div className="text-5xl sm:text-6xl">{currentPeriod?.emoji}</div>
          </div>

          {/* Period Description */}
          <Card className="mb-6 sm:mb-8 bg-white/10 border-white/20">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-lg text-white">{currentPeriod?.description}</p>
            </CardContent>
          </Card>

          {/* Scenarios */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center">Historical Scenarios</h3>
            {currentPeriod?.scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/10 border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">📜</div>
                      <div className="flex-1">
                        <h4 className="text-lg sm:text-xl font-bold text-white mb-2">{scenario.title}</h4>
                        <p className="text-sm sm:text-base text-gray-200 mb-3">{scenario.description}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-blue-300" />
                          <span className="text-blue-300 text-sm">Playing as: {scenario.character}</span>
                        </div>
                        <Button 
                          onClick={() => startScenario(scenario.id)}
                          className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white h-10"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Enter Scenario
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

  if (gameState === 'scenario') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentPeriod?.color} p-3 sm:p-4`}>
        <div className="max-w-4xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6">
            <Button variant="outline" onClick={backToTimeline} className="w-full sm:w-auto bg-gray-800/50 h-10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">Back to Timeline</span>
            </Button>
            <div className="text-center flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{currentScenario?.title}</h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-200">Playing as: {currentScenario?.character}</p>
            </div>
            <div className="text-3xl sm:text-4xl">⏳</div>
          </div>

          {/* Scenario Content */}
          <Card className="mb-4 sm:mb-6 bg-white/10 border-white/20">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎭</div>
                <p className="text-lg text-white mb-4">{currentScenario?.description}</p>
                
                <div className="bg-blue-100 p-4 rounded-lg mb-4">
                  <div className="font-semibold text-blue-800 mb-2">Historical Context:</div>
                  <div className="text-blue-700">{currentScenario?.historicalContext}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Choices */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xl font-bold text-white text-center">What do you choose to do?</h3>
            {currentScenario?.choices.map((choice, index) => (
              <motion.div
                key={choice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="bg-white/10 border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <Button 
                      onClick={() => makeChoice(choice)}
                      className="w-full text-left justify-start bg-transparent hover:bg-white/10 text-white p-4 h-auto"
                    >
                      <div>
                        <div className="text-lg font-semibold mb-2">{choice.text}</div>
                        <div className="text-sm text-gray-300">
                          Potential XP: {choice.xpReward} • Historical Accuracy: {choice.historicalAccuracy}%
                        </div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'results') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentPeriod?.color} p-4 flex items-center justify-center`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="bg-white/10 border-white/20 p-8">
            <CardContent>
              <div className="text-6xl mb-6">
                {scenarioResults && scenarioResults.accuracy >= 80 ? '🏆' : '📚'}
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Choice Made!</h2>
              
              {scenarioResults && (
                <div className="space-y-4 mb-8">
                  <div className="bg-white/20 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-white mb-2">Consequence:</div>
                    <div className="text-gray-200">{scenarioResults.choice.consequence}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-400">+{scenarioResults.xp} XP</div>
                      <div className="text-sm text-gray-300">Experience Gained</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{scenarioResults.accuracy}%</div>
                      <div className="text-sm text-gray-300">Historical Accuracy</div>
                    </div>
                  </div>
                  
                  {currentScenario && (
                    <div className="bg-green-100 p-4 rounded-lg">
                      <div className="font-semibold text-green-800 mb-2">What You Learned:</div>
                      <ul className="text-green-700 text-sm space-y-1">
                        {currentScenario.learningPoints.map((point, index) => (
                          <li key={index}>• {point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={backToTimeline}
                  className="bg-white/20 hover:bg-white/30 text-white px-8"
                >
                  📜 More Scenarios
                </Button>
                <Button 
                  onClick={resetToMenu}
                  className="bg-white/20 hover:bg-white/30 text-white px-8"
                >
                  ⏰ Time Machine
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
