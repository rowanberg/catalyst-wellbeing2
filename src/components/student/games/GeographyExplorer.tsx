'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  Globe, 
  MapPin, 
  Compass, 
  Mountain,
  Waves,
  TreePine,
  Sun,
  Snowflake,
  Trophy,
  Star,
  Camera,
  Backpack
} from 'lucide-react'
import { toast } from 'sonner'

interface Destination {
  id: string
  name: string
  country: string
  continent: string
  type: 'city' | 'landmark' | 'nature' | 'wonder'
  description: string
  emoji: string
  coordinates: { lat: number, lng: number }
  facts: string[]
  climate: string
  population?: string
  challenges: Challenge[]
  unlocked: boolean
}

interface Challenge {
  id: string
  type: 'quiz' | 'identify' | 'locate'
  question: string
  options?: string[]
  answer: string
  points: number
  hint?: string
}

interface ExplorerStats {
  level: number
  xp: number
  maxXp: number
  destinationsVisited: number
  continentsExplored: string[]
  badges: string[]
  photos: number
  gems: number
  accuracy: number
}

const DESTINATIONS: Destination[] = [
  {
    id: '1',
    name: 'Paris',
    country: 'France',
    continent: 'Europe',
    type: 'city',
    description: 'The City of Light, famous for the Eiffel Tower and art museums',
    emoji: '🗼',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    facts: [
      'Home to the Eiffel Tower, built in 1889',
      'The Louvre Museum houses the Mona Lisa',
      'Known as the fashion capital of the world'
    ],
    climate: 'Temperate oceanic',
    population: '2.1 million',
    unlocked: true,
    challenges: [
      {
        id: 'paris1',
        type: 'quiz',
        question: 'What famous tower is located in Paris?',
        options: ['Big Ben', 'Eiffel Tower', 'Leaning Tower', 'CN Tower'],
        answer: 'Eiffel Tower',
        points: 20
      },
      {
        id: 'paris2',
        type: 'quiz',
        question: 'Which famous painting is housed in the Louvre?',
        options: ['Starry Night', 'Mona Lisa', 'The Scream', 'Girl with Pearl Earring'],
        answer: 'Mona Lisa',
        points: 25
      }
    ]
  },
  {
    id: '2',
    name: 'Great Wall',
    country: 'China',
    continent: 'Asia',
    type: 'wonder',
    description: 'Ancient fortification stretching over 13,000 miles across China',
    emoji: '🏯',
    coordinates: { lat: 40.4319, lng: 116.5704 },
    facts: [
      'Built over many dynasties, primarily Ming Dynasty',
      'Stretches over 13,000 miles (21,000 km)',
      'Took over 2,000 years to build'
    ],
    climate: 'Continental',
    unlocked: true,
    challenges: [
      {
        id: 'wall1',
        type: 'quiz',
        question: 'How long is the Great Wall of China?',
        options: ['5,000 miles', '10,000 miles', '13,000 miles', '20,000 miles'],
        answer: '13,000 miles',
        points: 30
      }
    ]
  },
  {
    id: '3',
    name: 'Amazon Rainforest',
    country: 'Brazil',
    continent: 'South America',
    type: 'nature',
    description: 'The world\'s largest tropical rainforest, home to incredible biodiversity',
    emoji: '🌳',
    coordinates: { lat: -3.4653, lng: -62.2159 },
    facts: [
      'Produces 20% of the world\'s oxygen',
      'Home to over 400 billion trees',
      'Contains 10% of known species on Earth'
    ],
    climate: 'Tropical rainforest',
    unlocked: true,
    challenges: [
      {
        id: 'amazon1',
        type: 'quiz',
        question: 'What percentage of the world\'s oxygen does the Amazon produce?',
        options: ['10%', '15%', '20%', '25%'],
        answer: '20%',
        points: 35
      }
    ]
  },
  {
    id: '4',
    name: 'Sahara Desert',
    country: 'Multiple',
    continent: 'Africa',
    type: 'nature',
    description: 'The world\'s largest hot desert, covering much of North Africa',
    emoji: '🏜️',
    coordinates: { lat: 23.8859, lng: 8.5173 },
    facts: [
      'Covers 9 million square kilometers',
      'Larger than the entire United States',
      'Temperatures can reach 50°C (122°F)'
    ],
    climate: 'Hot desert',
    unlocked: true,
    challenges: [
      {
        id: 'sahara1',
        type: 'quiz',
        question: 'The Sahara Desert is located in which continent?',
        options: ['Asia', 'Australia', 'Africa', 'South America'],
        answer: 'Africa',
        points: 25
      }
    ]
  }
]

export function GeographyExplorer() {
  const [gameState, setGameState] = useState<'menu' | 'destination' | 'challenge' | 'results'>('menu')
  const [explorerStats, setExplorerStats] = useState<ExplorerStats>({
    level: 1,
    xp: 0,
    maxXp: 150,
    destinationsVisited: 0,
    continentsExplored: [],
    badges: [],
    photos: 0,
    gems: 0,
    accuracy: 0
  })
  const [destinations, setDestinations] = useState<Destination[]>(DESTINATIONS)
  const [currentDestination, setCurrentDestination] = useState<Destination | null>(null)
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [challengeResults, setChallengeResults] = useState<{
    correct: boolean
    points: number
    totalChallenges: number
    completedChallenges: number
  } | null>(null)

  const visitDestination = (destinationId: string) => {
    const destination = destinations.find(d => d.id === destinationId)
    if (!destination || !destination.unlocked) return
    
    setCurrentDestination(destination)
    setGameState('destination')
  }

  const startChallenge = (challengeId: string) => {
    if (!currentDestination) return
    
    const challenge = currentDestination.challenges.find(c => c.id === challengeId)
    if (!challenge) return
    
    setCurrentChallenge(challenge)
    setUserAnswer('')
    setGameState('challenge')
  }

  const submitAnswer = () => {
    if (!currentChallenge || !currentDestination) return
    
    const isCorrect = userAnswer.toLowerCase() === currentChallenge.answer.toLowerCase()
    const pointsEarned = isCorrect ? currentChallenge.points : 0
    
    if (isCorrect) {
      setExplorerStats(prev => {
        const newXp = prev.xp + pointsEarned
        const levelUp = newXp >= prev.maxXp
        const newContinents = prev.continentsExplored.includes(currentDestination.continent) 
          ? prev.continentsExplored 
          : [...prev.continentsExplored, currentDestination.continent]
        
        return {
          ...prev,
          xp: levelUp ? newXp - prev.maxXp : newXp,
          level: levelUp ? prev.level + 1 : prev.level,
          maxXp: levelUp ? prev.maxXp + 75 : prev.maxXp,
          continentsExplored: newContinents,
          photos: prev.photos + 1,
          gems: prev.gems + Math.floor(pointsEarned / 5),
          accuracy: Math.floor((prev.accuracy + 100) / 2)
        }
      })
      
      toast.success(`Correct! +${pointsEarned} XP earned!`)
    } else {
      setExplorerStats(prev => ({
        ...prev,
        accuracy: Math.floor((prev.accuracy + 0) / 2)
      }))
      
      toast.error(`Incorrect. The answer was: ${currentChallenge.answer}`)
    }
    
    setChallengeResults({
      correct: isCorrect,
      points: pointsEarned,
      totalChallenges: currentDestination.challenges.length,
      completedChallenges: 1
    })
    
    // Check if this completes the destination
    const allChallengesCompleted = true // Simplified for demo
    if (allChallengesCompleted && !explorerStats.destinationsVisited) {
      setExplorerStats(prev => ({ ...prev, destinationsVisited: prev.destinationsVisited + 1 }))
      
      // Unlock next destination
      const nextDestinationId = (parseInt(currentDestination.id) + 1).toString()
      setDestinations(prev => prev.map(dest => 
        dest.id === nextDestinationId ? { ...dest, unlocked: true } : dest
      ))
    }
    
    setGameState('results')
  }

  const takePhoto = () => {
    setExplorerStats(prev => ({ ...prev, photos: prev.photos + 1, gems: prev.gems + 2 }))
    toast.success('📸 Photo taken! +2 gems')
  }

  const resetToMenu = () => {
    setGameState('menu')
    setCurrentDestination(null)
    setCurrentChallenge(null)
    setChallengeResults(null)
  }

  const backToDestination = () => {
    setGameState('destination')
    setCurrentChallenge(null)
    setChallengeResults(null)
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-green-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-500 to-green-400 mb-4">
              🌍 Geography Explorer
            </h1>
            <p className="text-xl text-gray-300">Discover amazing places around the world!</p>
          </motion.div>

          {/* Explorer Stats */}
          <Card className="mb-8 bg-gradient-to-r from-teal-600/20 to-blue-600/20 border-teal-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-6 w-6 text-teal-400" />
                Explorer Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-400">Lv.{explorerStats.level}</div>
                  <div className="text-sm text-gray-300">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{explorerStats.destinationsVisited}</div>
                  <div className="text-sm text-gray-300">Destinations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{explorerStats.continentsExplored.length}</div>
                  <div className="text-sm text-gray-300">Continents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{explorerStats.photos}</div>
                  <div className="text-sm text-gray-300">Photos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{explorerStats.gems}</div>
                  <div className="text-sm text-gray-300">Gems</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Exploration Progress</span>
                  <span>{explorerStats.xp}/{explorerStats.maxXp}</span>
                </div>
                <Progress value={(explorerStats.xp / explorerStats.maxXp) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Destinations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((destination, index) => (
              <motion.div
                key={destination.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${
                  destination.unlocked
                    ? 'bg-gradient-to-br from-teal-600/20 to-blue-600/20 border-teal-400/30 hover:border-teal-400/60'
                    : 'bg-gradient-to-br from-gray-600/20 to-gray-700/20 border-gray-500/30'
                } transition-all cursor-pointer group`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                      {destination.unlocked ? destination.emoji : '🔒'}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{destination.name}</h3>
                    <p className="text-sm text-gray-300 mb-1">{destination.country}</p>
                    <p className="text-xs text-gray-400 mb-4">{destination.continent}</p>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between text-gray-300">
                        <span>Type:</span>
                        <Badge variant="secondary" className="text-xs">
                          {destination.type}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Challenges:</span>
                        <span className="text-teal-400">{destination.challenges.length}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                      onClick={() => visitDestination(destination.id)}
                      disabled={!destination.unlocked}
                    >
                      {destination.unlocked ? '🧭 Explore' : '🔒 Locked'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Continents Explored */}
          {explorerStats.continentsExplored.length > 0 && (
            <Card className="mt-8 bg-gradient-to-r from-green-600/20 to-teal-600/20 border-green-400/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Compass className="h-6 w-6 text-green-400" />
                  Continents Explored
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {explorerStats.continentsExplored.map((continent, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-600/20 text-green-300">
                      {continent}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (gameState === 'destination') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-blue-900 to-indigo-900 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6">
            <Button variant="outline" onClick={resetToMenu} className="w-full sm:w-auto bg-gray-800/50 h-10">
              <span className="text-sm sm:text-base">← Back to World Map</span>
            </Button>
            <div className="text-center flex-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{currentDestination?.name}</h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-200">{currentDestination?.country} • {currentDestination?.continent}</p>
            </div>
            <Button onClick={takePhoto} className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 h-10">
              <Camera className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">📸 Photo</span>
            </Button>
          </div>

          {/* Destination Info */}
          <Card className="mb-4 sm:mb-6 bg-gradient-to-br from-teal-600/20 to-blue-600/20 border-teal-400/30">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center mb-6">
                <div className="text-6xl sm:text-8xl mb-4">{currentDestination?.emoji}</div>
                <p className="text-base sm:text-lg text-white mb-4">{currentDestination?.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <div className="font-semibold text-blue-800 mb-2">Climate:</div>
                    <div className="text-blue-700">{currentDestination?.climate}</div>
                  </div>
                  {currentDestination?.population && (
                    <div className="bg-green-100 p-4 rounded-lg">
                      <div className="font-semibold text-green-800 mb-2">Population:</div>
                      <div className="text-green-700">{currentDestination.population}</div>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-100 p-4 rounded-lg">
                  <div className="font-semibold text-yellow-800 mb-2">Interesting Facts:</div>
                  <ul className="text-yellow-700 space-y-1">
                    {currentDestination?.facts.map((fact, index) => (
                      <li key={index}>• {fact}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Challenges */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center">Exploration Challenges</h3>
            {currentDestination?.challenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/10 border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-base sm:text-lg font-semibold text-white mb-2">
                          Challenge {index + 1}: {challenge.type.toUpperCase()}
                        </div>
                        <div className="text-sm sm:text-base text-gray-300 mb-2">{challenge.question}</div>
                        <div className="text-sm text-yellow-400">Reward: {challenge.points} XP</div>
                      </div>
                      <Button 
                        onClick={() => startChallenge(challenge.id)}
                        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 h-10 mt-2 sm:mt-0"
                      >
                        <span className="text-sm sm:text-base">Start Challenge</span>
                      </Button>
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6">
            <Button variant="outline" onClick={backToDestination} className="w-full sm:w-auto bg-gray-800/50 h-10">
              <span className="text-sm sm:text-base">← Back to {currentDestination?.name}</span>
            </Button>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Geography Challenge</h2>
              <p className="text-lg text-purple-300">{currentChallenge?.type.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <div className="text-lg text-yellow-400">🏆 {currentChallenge?.points} XP</div>
            </div>
          </div>

          {/* Challenge */}
          <Card className="mb-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-6xl mb-6">🤔</div>
              <div className="text-2xl font-bold text-white mb-6">
                {currentChallenge?.question}
              </div>
              
              {currentChallenge?.options ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {currentChallenge.options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => setUserAnswer(option)}
                      variant={userAnswer === option ? "default" : "outline"}
                      className="p-4 text-lg"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="mb-6">
                  <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="text-center text-lg font-bold"
                  />
                </div>
              )}
              
              <Button 
                onClick={submitAnswer}
                disabled={!userAnswer}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-3 text-lg"
              >
                Submit Answer
              </Button>
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
              <div className="text-8xl mb-6">
                {challengeResults?.correct ? '🎉' : '📚'}
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                {challengeResults?.correct ? 'Excellent!' : 'Keep Learning!'}
              </h2>
              
              {challengeResults && (
                <div className="space-y-4 mb-8">
                  <div className="text-xl text-gray-300">
                    {challengeResults.correct 
                      ? `You earned ${challengeResults.points} XP!` 
                      : 'Better luck next time!'
                    }
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-teal-400">{explorerStats.destinationsVisited}</div>
                      <div className="text-sm text-gray-300">Destinations Visited</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{explorerStats.photos}</div>
                      <div className="text-sm text-gray-300">Photos Taken</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={backToDestination}
                  className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 px-8"
                >
                  🗺️ Continue Exploring
                </Button>
                <Button 
                  onClick={resetToMenu}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8"
                >
                  🌍 World Map
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
