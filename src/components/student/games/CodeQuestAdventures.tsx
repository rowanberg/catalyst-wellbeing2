'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  Code, 
  Terminal, 
  Cpu, 
  Zap,
  Trophy,
  Star,
  Play,
  CheckCircle,
  XCircle,
  Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'

interface CodeChallenge {
  id: string
  title: string
  description: string
  difficulty: number
  language: string
  starterCode: string
  solution: string
  testCases: TestCase[]
  hints: string[]
  concept: string
}

interface TestCase {
  input: string
  expectedOutput: string
  description: string
}

interface CoderStats {
  level: number
  xp: number
  maxXp: number
  challengesCompleted: number
  streak: number
  gems: number
  languages: string[]
  badges: string[]
}

const CODE_CHALLENGES: CodeChallenge[] = [
  {
    id: '1',
    title: 'Hello World Quest',
    description: 'Begin your coding journey by greeting the world!',
    difficulty: 1,
    language: 'python',
    starterCode: '# Write a program that prints "Hello, World!"\n\n',
    solution: 'print("Hello, World!")',
    testCases: [
      {
        input: '',
        expectedOutput: 'Hello, World!',
        description: 'Should print the greeting message'
      }
    ],
    hints: [
      'Use the print() function to display text',
      'Put your text inside quotes: "Hello, World!"'
    ],
    concept: 'Basic Output'
  },
  {
    id: '2',
    title: 'Variable Adventure',
    description: 'Learn to store and use data with variables!',
    difficulty: 2,
    language: 'python',
    starterCode: '# Create a variable called "name" with your name\n# Then print "My name is [your name]"\n\n',
    solution: 'name = "Coder"\nprint("My name is " + name)',
    testCases: [
      {
        input: '',
        expectedOutput: 'My name is Coder',
        description: 'Should use a variable to store and display name'
      }
    ],
    hints: [
      'Create a variable: name = "YourName"',
      'Use + to combine strings: "Hello " + name'
    ],
    concept: 'Variables and Strings'
  },
  {
    id: '3',
    title: 'Math Magic',
    description: 'Use programming to solve mathematical problems!',
    difficulty: 3,
    language: 'python',
    starterCode: '# Calculate the area of a rectangle\n# width = 5, height = 3\n# Print the result\n\n',
    solution: 'width = 5\nheight = 3\narea = width * height\nprint(area)',
    testCases: [
      {
        input: '',
        expectedOutput: '15',
        description: 'Should calculate 5 * 3 = 15'
      }
    ],
    hints: [
      'Area of rectangle = width * height',
      'Store the result in a variable called "area"'
    ],
    concept: 'Arithmetic Operations'
  },
  {
    id: '4',
    title: 'Loop Legend',
    description: 'Master the power of repetition with loops!',
    difficulty: 4,
    language: 'python',
    starterCode: '# Print numbers 1 to 5 using a for loop\n\n',
    solution: 'for i in range(1, 6):\n    print(i)',
    testCases: [
      {
        input: '',
        expectedOutput: '1\n2\n3\n4\n5',
        description: 'Should print numbers 1 through 5, each on a new line'
      }
    ],
    hints: [
      'Use for i in range(1, 6): to loop from 1 to 5',
      'Remember to indent the print statement inside the loop'
    ],
    concept: 'For Loops'
  }
]

export function CodeQuestAdventures() {
  const [gameState, setGameState] = useState<'menu' | 'challenge' | 'results'>('menu')
  const [coderStats, setCoderStats] = useState<CoderStats>({
    level: 1,
    xp: 0,
    maxXp: 120,
    challengesCompleted: 0,
    streak: 0,
    gems: 0,
    languages: ['python'],
    badges: []
  })
  const [currentChallenge, setCurrentChallenge] = useState<CodeChallenge | null>(null)
  const [userCode, setUserCode] = useState('')
  const [testResults, setTestResults] = useState<{passed: boolean, output: string}[]>([])
  const [showHints, setShowHints] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const startChallenge = (challengeId: string) => {
    const challenge = CODE_CHALLENGES.find(c => c.id === challengeId)
    if (!challenge) return
    
    setCurrentChallenge(challenge)
    setUserCode(challenge.starterCode)
    setTestResults([])
    setShowHints(false)
    setAttempts(0)
    setGameState('challenge')
  }

  const runCode = async () => {
    if (!currentChallenge) return
    
    setIsRunning(true)
    setAttempts(prev => prev + 1)
    
    // Simulate code execution (in a real app, this would use a code execution service)
    setTimeout(() => {
      const results = currentChallenge.testCases.map(testCase => {
        // Simple pattern matching for educational purposes
        const normalizedCode = userCode.toLowerCase().replace(/\s+/g, ' ').trim()
        const normalizedSolution = currentChallenge.solution.toLowerCase().replace(/\s+/g, ' ').trim()
        
        // Check if code contains key elements
        const passed = checkCodeSolution(normalizedCode, testCase, currentChallenge)
        
        return {
          passed,
          output: passed ? testCase.expectedOutput : 'Incorrect output'
        }
      })
      
      setTestResults(results)
      setIsRunning(false)
      
      const allPassed = results.every(r => r.passed)
      if (allPassed) {
        handleSuccess()
      } else {
        handleFailure()
      }
    }, 1500)
  }

  const checkCodeSolution = (code: string, testCase: TestCase, challenge: CodeChallenge): boolean => {
    // Simple educational code checking
    switch (challenge.id) {
      case '1':
        return code.includes('print') && code.includes('hello, world!')
      case '2':
        return code.includes('name') && code.includes('=') && code.includes('print') && code.includes('+')
      case '3':
        return code.includes('width') && code.includes('height') && code.includes('*') && code.includes('15')
      case '4':
        return code.includes('for') && code.includes('range') && code.includes('print')
      default:
        return false
    }
  }

  const handleSuccess = () => {
    if (!currentChallenge) return
    
    const baseXp = currentChallenge.difficulty * 30
    const attemptBonus = Math.max(0, (4 - attempts) * 10)
    const totalXp = baseXp + attemptBonus
    const gemsEarned = currentChallenge.difficulty * 5 + (attempts === 1 ? 10 : 0)
    
    setCoderStats(prev => {
      const newXp = prev.xp + totalXp
      const levelUp = newXp >= prev.maxXp
      
      return {
        ...prev,
        xp: levelUp ? newXp - prev.maxXp : newXp,
        level: levelUp ? prev.level + 1 : prev.level,
        maxXp: levelUp ? prev.maxXp + 60 : prev.maxXp,
        challengesCompleted: prev.challengesCompleted + 1,
        streak: prev.streak + 1,
        gems: prev.gems + gemsEarned
      }
    })
    
    setGameState('results')
    toast.success(`Challenge completed! +${totalXp} XP, +${gemsEarned} gems`)
  }

  const handleFailure = () => {
    setCoderStats(prev => ({ ...prev, streak: 0 }))
    
    if (attempts >= 3) {
      setShowHints(true)
      toast.error('Need help? Check the hints!')
    } else {
      toast.error('Tests failed. Debug your code and try again!')
    }
  }

  const resetToMenu = () => {
    setGameState('menu')
    setCurrentChallenge(null)
    setUserCode('')
    setTestResults([])
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 mb-4">
              💻 Code Quest Adventures
            </h1>
            <p className="text-xl text-gray-300">Learn programming through epic coding quests!</p>
          </motion.div>

          {/* Coder Stats */}
          <Card className="mb-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Terminal className="h-6 w-6 text-green-400" />
                Coder Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">Lv.{coderStats.level}</div>
                  <div className="text-sm text-gray-300">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{coderStats.challengesCompleted}</div>
                  <div className="text-sm text-gray-300">Challenges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{coderStats.streak}</div>
                  <div className="text-sm text-gray-300">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{coderStats.languages.length}</div>
                  <div className="text-sm text-gray-300">Languages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{coderStats.gems}</div>
                  <div className="text-sm text-gray-300">Gems</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Coding Progress</span>
                  <span>{coderStats.xp}/{coderStats.maxXp}</span>
                </div>
                <Progress value={(coderStats.xp / coderStats.maxXp) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CODE_CHALLENGES.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border-green-400/30 hover:border-green-400/60 transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        💻
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
                        <p className="text-gray-300 text-sm mb-4">{challenge.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Language:</span>
                            <Badge variant="secondary" className="bg-green-600/20 text-green-300">
                              {challenge.language}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Difficulty:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < challenge.difficulty ? 'text-yellow-400 fill-current' : 'text-gray-500'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Concept:</span>
                            <span className="text-blue-400">{challenge.concept}</span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                          onClick={() => startChallenge(challenge.id)}
                          disabled={coderStats.level < challenge.difficulty}
                        >
                          {coderStats.level < challenge.difficulty ? '🔒 Locked' : '🚀 Start Quest'}
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

  if (gameState === 'challenge') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 p-3 sm:p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6">
            <Button variant="outline" onClick={resetToMenu} className="w-full sm:w-auto bg-gray-800/50 h-10">
              <span className="text-sm sm:text-base">← Back to Quests</span>
            </Button>
            <div className="text-center flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{currentChallenge?.title}</h2>
              <div className="text-sm sm:text-base lg:text-lg text-green-300">
                {currentChallenge?.language} • Difficulty: {currentChallenge?.difficulty}/5
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-base sm:text-lg text-blue-400">Attempts: {attempts}</div>
              <div className="text-xs sm:text-sm text-gray-300">Streak: {coderStats.streak}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Challenge Description */}
            <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/30">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <Code className="h-5 w-5 text-blue-400" />
                  Quest Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-gray-300">{currentChallenge?.description}</p>
                  
                  <div className="bg-green-100 p-3 rounded border-l-4 border-green-500">
                    <div className="font-semibold text-green-800 mb-1">Learning Goal:</div>
                    <div className="text-green-700">{currentChallenge?.concept}</div>
                  </div>

                  {showHints && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-yellow-100 p-3 rounded border-l-4 border-yellow-500"
                    >
                      <div className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Hints:
                      </div>
                      <ul className="text-yellow-700 space-y-1">
                        {currentChallenge?.hints.map((hint, index) => (
                          <li key={index}>• {hint}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Test Cases */}
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="font-semibold text-gray-300 mb-2">Test Cases:</div>
                    {currentChallenge?.testCases.map((testCase, index) => (
                      <div key={index} className="text-sm text-gray-400 mb-1">
                        Expected: "{testCase.expectedOutput}"
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Code Editor */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-600/30">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <Terminal className="h-5 w-5 text-green-400" />
                  Code Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <Textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    placeholder="Write your code here..."
                    className="min-h-[300px] font-mono text-sm bg-gray-900 text-green-400 border-gray-600"
                  />
                  
                  <Button 
                    onClick={runCode}
                    disabled={isRunning || !userCode.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    {isRunning ? (
                      <>
                        <Cpu className="h-4 w-4 mr-2 animate-spin" />
                        Running Code...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Code
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card className="mt-6 bg-gray-900/50 border-gray-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded ${
                        result.passed ? 'bg-green-600/20 border border-green-500/30' : 'bg-red-600/20 border border-red-500/30'
                      }`}
                    >
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <div className={`font-semibold ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
                          Test {index + 1}: {result.passed ? 'PASSED' : 'FAILED'}
                        </div>
                        <div className="text-sm text-gray-400">
                          Output: {result.output}
                        </div>
                      </div>
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
              <h2 className="text-4xl font-bold text-green-400 mb-4">QUEST COMPLETED!</h2>
              <p className="text-xl text-white mb-6">
                You successfully solved {currentChallenge?.title}!
              </p>
              
              <div className="space-y-2 mb-8 text-lg text-gray-300">
                <div>💻 Concept Mastered: {currentChallenge?.concept}</div>
                <div>🎯 Attempts: {attempts}</div>
                <div>⚡ Streak: {coderStats.streak}</div>
                <div>🔥 Total Challenges: {coderStats.challengesCompleted}</div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={resetToMenu}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8"
                >
                  🏠 Back to Quests
                </Button>
                <Button 
                  onClick={() => {
                    const nextChallenge = CODE_CHALLENGES.find(c => parseInt(c.id) === parseInt(currentChallenge?.id || '1') + 1)
                    if (nextChallenge && coderStats.level >= nextChallenge.difficulty) {
                      startChallenge(nextChallenge.id)
                    } else {
                      resetToMenu()
                    }
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8"
                >
                  🚀 Next Quest
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
