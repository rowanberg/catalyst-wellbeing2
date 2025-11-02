'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Beaker, 
  TestTube, 
  Microscope, 
  Atom, 
  Zap, 
  Eye, 
  Shield, 
  Flame, 
  AlertTriangle, 
  CheckCircle, 
  Star 
} from 'lucide-react'
import { toast } from 'sonner'

interface Experiment {
  id: string
  name: string
  type: 'chemistry' | 'physics'
  difficulty: number
  description: string
  equipment: string[]
  steps: ExperimentStep[]
  safetyRules: string[]
  expectedResult: string
  learningObjective: string
}

interface ExperimentStep {
  id: number
  instruction: string
  action: 'mix' | 'heat' | 'measure' | 'observe' | 'wait'
  parameters?: { [key: string]: any }
  safety?: string
  result?: string
}

interface LabStats {
  level: number
  xp: number
  maxXp: number
  experimentsCompleted: number
  safetyScore: number
  accuracy: number
  gems: number
}

const EXPERIMENTS: Experiment[] = [
  {
    id: '1',
    name: 'Acid-Base Indicator',
    type: 'chemistry',
    difficulty: 1,
    description: 'Learn how indicators change color in different pH solutions',
    equipment: ['pH indicator', 'acid solution', 'base solution', 'test tubes', 'dropper'],
    steps: [
      {
        id: 1,
        instruction: 'Put on safety goggles and gloves',
        action: 'observe',
        safety: 'Always wear protective equipment when handling chemicals'
      },
      {
        id: 2,
        instruction: 'Add 5ml of acid solution to test tube A',
        action: 'measure',
        parameters: { volume: 5, substance: 'acid' }
      },
      {
        id: 3,
        instruction: 'Add 3 drops of pH indicator to test tube A',
        action: 'mix',
        parameters: { drops: 3, substance: 'indicator' }
      },
      {
        id: 4,
        instruction: 'Observe the color change',
        action: 'observe',
        result: 'Solution turns red (acidic)'
      },
      {
        id: 5,
        instruction: 'Repeat with base solution in test tube B',
        action: 'mix',
        result: 'Solution turns blue (basic)'
      }
    ],
    safetyRules: [
      'Wear safety goggles at all times',
      'Handle chemicals with care',
      'Never taste chemicals',
      'Wash hands after experiment'
    ],
    expectedResult: 'Acid turns indicator red, base turns indicator blue',
    learningObjective: 'Understand pH and acid-base reactions'
  },
  {
    id: '2',
    name: 'Pendulum Motion',
    type: 'physics',
    difficulty: 2,
    description: 'Study the relationship between pendulum length and period',
    equipment: ['string', 'weight', 'ruler', 'stopwatch', 'protractor'],
    steps: [
      {
        id: 1,
        instruction: 'Set up pendulum with 30cm string length',
        action: 'measure',
        parameters: { length: 30 }
      },
      {
        id: 2,
        instruction: 'Pull pendulum to 15° angle',
        action: 'measure',
        parameters: { angle: 15 }
      },
      {
        id: 3,
        instruction: 'Release and time 10 complete swings',
        action: 'observe',
        parameters: { swings: 10 }
      },
      {
        id: 4,
        instruction: 'Calculate the period (time ÷ 10)',
        action: 'measure',
        result: 'Period ≈ 1.1 seconds'
      },
      {
        id: 5,
        instruction: 'Repeat with 60cm string',
        action: 'measure',
        result: 'Period ≈ 1.6 seconds (longer period)'
      }
    ],
    safetyRules: [
      'Ensure clear swing area',
      'Secure weight properly',
      'Stand clear of pendulum path'
    ],
    expectedResult: 'Longer pendulum has longer period',
    learningObjective: 'Understand pendulum physics and periodic motion'
  },
  {
    id: '3',
    name: 'Crystal Growth',
    type: 'chemistry',
    difficulty: 3,
    description: 'Grow crystals and observe molecular structures',
    equipment: ['salt', 'hot water', 'string', 'magnifying glass', 'beaker'],
    steps: [
      {
        id: 1,
        instruction: 'Heat water to 80°C',
        action: 'heat',
        parameters: { temperature: 80 },
        safety: 'Use heat-resistant gloves'
      },
      {
        id: 2,
        instruction: 'Dissolve salt until saturated',
        action: 'mix',
        parameters: { substance: 'salt' }
      },
      {
        id: 3,
        instruction: 'Suspend string in solution',
        action: 'observe'
      },
      {
        id: 4,
        instruction: 'Wait 24 hours for crystal formation',
        action: 'wait',
        parameters: { time: 24 }
      },
      {
        id: 5,
        instruction: 'Examine crystals with magnifying glass',
        action: 'observe',
        result: 'Cubic salt crystals formed'
      }
    ],
    safetyRules: [
      'Handle hot water carefully',
      'Use proper ventilation',
      'Keep workspace clean'
    ],
    expectedResult: 'Regular cubic salt crystals form on string',
    learningObjective: 'Learn about crystallization and molecular structure'
  }
]

export function ScienceLabSimulator() {
  const [gameState, setGameState] = useState<'menu' | 'experiment' | 'results'>('menu')
  const [labStats, setLabStats] = useState<LabStats>({
    level: 1,
    xp: 0,
    maxXp: 200,
    experimentsCompleted: 0,
    safetyScore: 100,
    accuracy: 0,
    gems: 0
  })
  const [currentExperiment, setCurrentExperiment] = useState<Experiment | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [safetyViolations, setSafetyViolations] = useState(0)
  const [experimentResults, setExperimentResults] = useState<string[]>([])
  const [showSafety, setShowSafety] = useState(false)

  const startExperiment = (experimentId: string) => {
    const experiment = EXPERIMENTS.find(e => e.id === experimentId)
    if (!experiment) return
    
    setCurrentExperiment(experiment)
    setCurrentStep(0)
    setCompletedSteps([])
    setSafetyViolations(0)
    setExperimentResults([])
    setShowSafety(true)
    setGameState('experiment')
  }

  const proceedToExperiment = () => {
    setShowSafety(false)
  }

  const executeStep = (stepIndex: number) => {
    if (!currentExperiment) return
    
    const step = currentExperiment.steps[stepIndex]
    if (!step) return
    
    // Check if safety step was skipped
    if (step.safety && !completedSteps.includes(stepIndex - 1) && stepIndex > 0) {
      setSafetyViolations(prev => prev + 1)
      toast.error('Safety violation! Always follow safety procedures.')
    }
    
    setCompletedSteps(prev => [...prev, stepIndex])
    
    if (step.result) {
      setExperimentResults(prev => [...prev, step.result!])
    }
    
    // Add step completion message
    const messages = {
      'mix': '🧪 Mixed successfully!',
      'heat': '🔥 Heating complete!',
      'measure': '📏 Measurement taken!',
      'observe': '👁️ Observation recorded!',
      'wait': '⏳ Waiting period started!'
    }
    
    toast.success(messages[step.action] || 'Step completed!')
    
    if (stepIndex === currentExperiment.steps.length - 1) {
      completeExperiment()
    } else {
      setCurrentStep(stepIndex + 1)
    }
  }

  const completeExperiment = () => {
    if (!currentExperiment) return
    
    const baseXp = currentExperiment.difficulty * 50
    const safetyBonus = Math.max(0, (3 - safetyViolations) * 20)
    const accuracyBonus = completedSteps.length === currentExperiment.steps.length ? 30 : 0
    const totalXp = baseXp + safetyBonus + accuracyBonus
    const gemsEarned = currentExperiment.difficulty * 10 + (safetyViolations === 0 ? 20 : 0)
    
    const newSafetyScore = Math.max(0, 100 - (safetyViolations * 10))
    const newAccuracy = (completedSteps.length / currentExperiment.steps.length) * 100
    
    setLabStats(prev => {
      const newXp = prev.xp + totalXp
      const levelUp = newXp >= prev.maxXp
      
      return {
        ...prev,
        xp: levelUp ? newXp - prev.maxXp : newXp,
        level: levelUp ? prev.level + 1 : prev.level,
        maxXp: levelUp ? prev.maxXp + 100 : prev.maxXp,
        experimentsCompleted: prev.experimentsCompleted + 1,
        safetyScore: Math.floor((prev.safetyScore + newSafetyScore) / 2),
        accuracy: Math.floor((prev.accuracy + newAccuracy) / 2),
        gems: prev.gems + gemsEarned
      }
    })
    
    setGameState('results')
    toast.success(`Experiment complete! +${totalXp} XP, +${gemsEarned} gems`)
  }

  const resetToMenu = () => {
    setGameState('menu')
    setCurrentExperiment(null)
    setCurrentStep(0)
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-green-900 p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <motion.div 
            className="absolute top-20 left-10 w-72 h-72 bg-teal-500/30 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
            animate={{ scale: [1, 1.3, 1], y: [0, -50, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/3 w-64 h-64 bg-green-500/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header - Enhanced */}
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block mb-6"
              animate={{ 
                rotateY: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <div className="text-8xl drop-shadow-2xl">🔬</div>
            </motion.div>
            <motion.h1 
              className="text-5xl sm:text-7xl font-black mb-4"
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(52, 211, 153, 0.3)'
              }}
            >
              SCIENCE LAB SIMULATOR
            </motion.h1>
            <motion.p 
              className="text-xl sm:text-2xl text-teal-200 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              ⚗️ Conduct virtual experiments • Learn real science • Stay safe! ⚗️
            </motion.p>
          </motion.div>

          {/* Lab Stats - Enhanced */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="mb-10 bg-gradient-to-br from-teal-900/40 to-blue-900/40 border-2 border-teal-400/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-teal-600/30 to-blue-600/30 border-b border-teal-400/30">
                <CardTitle className="flex items-center justify-center gap-3 text-white text-xl sm:text-2xl">
                  <Microscope className="h-7 w-7 text-teal-400" />
                  Lab Scientist Profile
                  <Atom className="h-7 w-7 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <motion.div 
                    className="text-center p-4 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-xl border border-teal-400/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl font-black text-teal-300">Lv.{labStats.level}</div>
                    <div className="text-sm text-teal-200 font-medium mt-1">Level</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-400/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl font-black text-green-300">{labStats.experimentsCompleted}</div>
                    <div className="text-sm text-green-200 font-medium mt-1">Experiments</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-400/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl font-black text-blue-300">{labStats.safetyScore}%</div>
                    <div className="text-sm text-blue-200 font-medium mt-1">Safety</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-400/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl font-black text-purple-300">{labStats.accuracy}%</div>
                    <div className="text-sm text-purple-200 font-medium mt-1">Accuracy</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl border border-yellow-400/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl font-black text-yellow-300">{labStats.gems}</div>
                    <div className="text-sm text-yellow-200 font-medium mt-1">Gems</div>
                  </motion.div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-teal-500/30">
                  <div className="flex justify-between text-sm text-teal-200 mb-2 font-semibold">
                    <span>🔬 Research Progress</span>
                    <span className="text-teal-300">{labStats.xp}/{labStats.maxXp} XP</span>
                  </div>
                  <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden border border-teal-500/30">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-teal-500 via-blue-500 to-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(labStats.xp / labStats.maxXp) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Experiments */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXPERIMENTS.map((experiment, index) => (
              <motion.div
                key={experiment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${
                  experiment.type === 'chemistry'
                    ? 'bg-gradient-to-br from-green-900/60 to-teal-900/60 border-2 border-green-400/40'
                    : 'bg-gradient-to-br from-blue-900/60 to-purple-900/60 border-2 border-blue-400/40'
                } hover:border-opacity-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group backdrop-blur-sm relative overflow-hidden`}>
                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
                    experiment.type === 'chemistry' 
                      ? 'bg-gradient-to-br from-green-400 to-teal-400'
                      : 'bg-gradient-to-br from-blue-400 to-purple-400'
                  }`} />
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="text-center mb-4">
                      <motion.div 
                        className="text-7xl mb-3 inline-block"
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                      >
                        {experiment.type === 'chemistry' ? '🧪' : '⚡'}
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-200 transition-colors">{experiment.name}</h3>
                      <p className="text-sm text-gray-300 mb-4 leading-relaxed">{experiment.description}</p>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Type:</span>
                        <Badge variant={experiment.type === 'chemistry' ? 'default' : 'secondary'}>
                          {experiment.type}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Difficulty:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < experiment.difficulty ? 'text-yellow-400 fill-current' : 'text-gray-500'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Steps:</span>
                        <span className="text-teal-400">{experiment.steps.length}</span>
                      </div>
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className={`w-full h-12 font-bold text-base shadow-xl ${
                          experiment.type === 'chemistry'
                            ? 'bg-gradient-to-r from-green-500 via-teal-500 to-green-600 hover:from-green-600 hover:via-teal-600 hover:to-green-700 border-2 border-green-400'
                            : 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 border-2 border-blue-400'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={() => startExperiment(experiment.id)}
                        disabled={labStats.level < experiment.difficulty}
                      >
                        {labStats.level < experiment.difficulty ? '🔒 Locked' : '🔬 Start Experiment'}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'experiment') {
    if (showSafety && currentExperiment) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 p-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl"
          >
            <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-400/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-2xl">
                  <Shield className="h-8 w-8 text-red-400" />
                  Safety First!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-yellow-100 rounded-lg border-l-4 border-yellow-500">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    <div>
                      <div className="font-semibold text-yellow-800">Safety Rules for {currentExperiment.name}</div>
                      <div className="text-sm text-yellow-700">Please read carefully before proceeding</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {currentExperiment.safetyRules.map((rule, index) => (
                      <div key={index} className="flex items-start gap-3 text-white">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <div className="font-semibold text-blue-800 mb-2">Learning Objective:</div>
                    <div className="text-blue-700">{currentExperiment.learningObjective}</div>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={resetToMenu}>
                      ← Back to Lab
                    </Button>
                    <Button 
                      onClick={proceedToExperiment}
                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                    >
                      🔬 I Understand - Start Experiment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-blue-900 to-indigo-900 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6">
            <Button variant="outline" onClick={resetToMenu} className="w-full sm:w-auto bg-gray-800/50 h-10">
              <span className="text-sm sm:text-base">← Back to Lab</span>
            </Button>
            <div className="text-center flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{currentExperiment?.name}</h2>
              <div className="text-sm sm:text-base lg:text-lg text-teal-300">
                Step {currentStep + 1} of {currentExperiment?.steps.length}
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-base sm:text-lg text-red-400">⚠️ Safety: {3 - safetyViolations}/3</div>
            </div>
          </div>

          {/* Current Step */}
          {currentExperiment && (
            <Card className="mb-4 sm:mb-6 bg-gradient-to-br from-teal-600/20 to-blue-600/20 border-teal-400/30">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-center text-white text-lg sm:text-xl flex items-center justify-center gap-2">
                  {currentExperiment.steps[currentStep]?.action === 'mix' && <Beaker className="h-6 w-6" />}
                  {currentExperiment.steps[currentStep]?.action === 'heat' && <Flame className="h-6 w-6" />}
                  {currentExperiment.steps[currentStep]?.action === 'measure' && <TestTube className="h-6 w-6" />}
                  {currentExperiment.steps[currentStep]?.action === 'observe' && <Eye className="h-6 w-6" />}
                  {currentExperiment.steps[currentStep]?.action === 'wait' && <Zap className="h-6 w-6" />}
                  Current Step
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4">
                    {currentExperiment.steps[currentStep]?.instruction}
                  </div>
                  
                  {currentExperiment.steps[currentStep]?.safety && (
                    <div className="bg-red-100 p-3 rounded border-l-4 border-red-500">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Safety Note:</span>
                      </div>
                      <div className="text-red-600 mt-1">
                        {currentExperiment.steps[currentStep]?.safety}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => executeStep(currentStep)}
                    className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 px-6 sm:px-8 py-3 text-base sm:text-lg h-12"
                  >
                    ✅ Execute Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Equipment & Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Equipment */}
            <Card className="bg-gray-900/50 border-gray-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-teal-400" />
                  Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentExperiment?.equipment.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="bg-gray-900/50 border-gray-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Atom className="h-5 w-5 text-purple-400" />
                  Observations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 h-32 overflow-y-auto">
                  {experimentResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-gray-300 text-sm"
                    >
                      📝 {result}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          <Card className="mt-6 bg-gray-900/50 border-gray-600/30">
            <CardContent className="p-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Experiment Progress</span>
                <span>{completedSteps.length}/{currentExperiment?.steps.length}</span>
              </div>
              <Progress 
                value={(completedSteps.length / (currentExperiment?.steps.length || 1)) * 100} 
                className="h-3" 
              />
            </CardContent>
          </Card>
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
              <h2 className="text-4xl font-bold text-green-400 mb-4">EXPERIMENT COMPLETE!</h2>
              <p className="text-xl text-white mb-6">
                You successfully completed {currentExperiment?.name}!
              </p>
              
              <div className="space-y-2 mb-8 text-lg text-gray-300">
                <div>🔬 Expected Result: {currentExperiment?.expectedResult}</div>
                <div>⚠️ Safety Violations: {safetyViolations}</div>
                <div>✅ Steps Completed: {completedSteps.length}/{currentExperiment?.steps.length}</div>
                <div>📊 Accuracy: {Math.floor((completedSteps.length / (currentExperiment?.steps.length || 1)) * 100)}%</div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={resetToMenu}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8"
                >
                  🏠 Back to Lab
                </Button>
                <Button 
                  onClick={() => {
                    const nextExperiment = EXPERIMENTS.find(e => parseInt(e.id) === parseInt(currentExperiment?.id || '1') + 1)
                    if (nextExperiment && labStats.level >= nextExperiment.difficulty) {
                      startExperiment(nextExperiment.id)
                    } else {
                      resetToMenu()
                    }
                  }}
                  className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 px-8"
                >
                  🔬 Next Experiment
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
