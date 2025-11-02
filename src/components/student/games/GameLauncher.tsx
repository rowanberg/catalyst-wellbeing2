'use client'

import { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Trophy, 
  Gem,
  Play,
  ArrowLeft,
  Gamepad2,
  Target,
  Zap,
  Sparkles,
  Shield,
  Users2,
  Brain
} from 'lucide-react'

import { 
  PREMIUM_GAMES, 
  GAME_CATEGORIES, 
  DIFFICULTY_LEVELS
} from './index'

// Lazy loaded game components
const MathBattleArena = lazy(() => import('./MathBattleArena').then(m => ({ default: m.MathBattleArena })))
const WordWizardAcademy = lazy(() => import('./WordWizardAcademy').then(m => ({ default: m.WordWizardAcademy })))
const ScienceLabSimulator = lazy(() => import('./ScienceLabSimulator').then(m => ({ default: m.ScienceLabSimulator })))
const HistoryTimeMachine = lazy(() => import('./HistoryTimeMachine').then(m => ({ default: m.HistoryTimeMachine })))
const CodeQuestAdventures = lazy(() => import('./CodeQuestAdventures').then(m => ({ default: m.CodeQuestAdventures })))
const GeographyExplorer = lazy(() => import('./GeographyExplorer').then(m => ({ default: m.GeographyExplorer })))
const BrainTrainingGym = lazy(() => import('./BrainTrainingGym').then(m => ({ default: m.BrainTrainingGym })))

const GAME_COMPONENTS = {
  'MathBattleArena': MathBattleArena,
  'WordWizardAcademy': WordWizardAcademy,
  'ScienceLabSimulator': ScienceLabSimulator,
  'HistoryTimeMachine': HistoryTimeMachine,
  'CodeQuestAdventures': CodeQuestAdventures,
  'GeographyExplorer': GeographyExplorer,
  'BrainTrainingGym': BrainTrainingGym
}

interface PlayerStats {
  totalXP: number
  totalGems: number
  gamesPlayed: number
  favoriteCategory: string
  totalPlayTime: string
  achievements: number
}

interface GameLauncherProps {
  hideBackButton?: boolean
  onBackToLauncher?: () => void
  onGameLaunch?: () => void
}

export function GameLauncher({ hideBackButton = false, onBackToLauncher, onGameLaunch }: GameLauncherProps = {}) {
  const [currentView, setCurrentView] = useState<'launcher' | 'game'>('launcher')
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Games')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels')
  const [playerStats] = useState<PlayerStats>({
    totalXP: 1250,
    totalGems: 340,
    gamesPlayed: 23,
    favoriteCategory: 'Mathematics',
    totalPlayTime: '4h 32m',
    achievements: 12
  })

  const filteredGames = PREMIUM_GAMES.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.subjects.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All Games' || game.category === selectedCategory
    
    const matchesDifficulty = selectedDifficulty === 'All Levels' || 
                             game.difficulty.includes(selectedDifficulty)
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const launchGame = (gameId: string) => {
    console.log('Launching game:', gameId)
    const game = PREMIUM_GAMES.find(g => g.id === gameId)
    console.log('Found game:', game)
    if (game) {
      console.log('Setting selected game to:', game.component)
      setSelectedGame(game.component)
      setCurrentView('game')
      if (onGameLaunch) {
        onGameLaunch()
      }
    } else {
      console.error('Game not found:', gameId)
    }
  }

  const backToLauncher = () => {
    if (onBackToLauncher) {
      onBackToLauncher()
    }
    setCurrentView('launcher')
    setSelectedGame(null)
  }

  if (currentView === 'game' && selectedGame) {
    console.log('Rendering game view for:', selectedGame)
    const GameComponent = GAME_COMPONENTS[selectedGame as keyof typeof GAME_COMPONENTS]
    console.log('GameComponent:', GameComponent)
    
    if (!GameComponent) {
      console.error('GameComponent not found for:', selectedGame)
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black p-4 flex items-center justify-center">
          <Card className="bg-gradient-to-br from-red-600/20 to-gray-600/20 border-red-400/30 p-8">
            <CardContent className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
              <p className="text-gray-300 mb-4">The game "{selectedGame}" could not be loaded.</p>
              <Button onClick={backToLauncher} className="bg-blue-600 hover:bg-blue-700">
                Back to Games
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    return (
      <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
        {!hideBackButton && (
          <Button 
            onClick={backToLauncher}
            className="absolute top-4 left-4 z-[60] bg-gray-900/90 hover:bg-gray-900 text-white backdrop-blur-sm border border-white/20"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        )}
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
            <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-400/30 p-8">
              <CardContent className="text-center">
                <motion.div 
                  className="text-6xl mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🎮
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Loading Game...</h2>
                <p className="text-gray-300">Preparing your epic adventure!</p>
                <div className="mt-4 w-64 bg-gray-700 rounded-full h-2 mx-auto">
                  <motion.div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        }>
          <div className="w-full min-h-screen">
            <GameComponent />
          </div>
        </Suspense>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 overflow-hidden flex flex-col">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-10 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Compact Header */}
        <motion.header 
          className="relative py-6 px-4 sm:px-6 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-indigo-900/40 backdrop-blur-sm border-b border-white/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-wider">
                LEARNING GAMES
              </h1>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 pb-8" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <div className="max-w-7xl mx-auto space-y-8">

        {/* Compact Search and Filter */}
        <Card className="mb-6 bg-gray-800/50 border-gray-600/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 text-sm"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40 h-9 bg-gray-700/50 border-gray-600 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAME_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-full sm:w-36 h-9 bg-gray-700/50 border-gray-600 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Compact Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          <AnimatePresence>
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                layout
                whileHover={{ y: -8, scale: 1.05 }}
                className="group"
              >
                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-2 border-gray-600/50 hover:border-purple-500/80 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-purple-500/20 h-full backdrop-blur-xl relative overflow-hidden">
                  {/* Hover Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all duration-300 pointer-events-none" />
                  
                  <CardContent className="p-5 h-full flex flex-col relative z-10">
                    {/* Game Header */}
                    <div className="text-center mb-4">
                      <motion.div 
                        className="text-5xl mb-3 inline-block filter drop-shadow-lg"
                        whileHover={{ 
                          scale: 1.3, 
                          rotate: [0, -10, 10, -10, 0],
                          filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))"
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {game.emoji}
                      </motion.div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">
                        {game.name}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3 leading-relaxed h-10 overflow-hidden group-hover:text-gray-200">{game.description}</p>
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-200 border border-purple-500/30 shadow-lg">
                        {game.category}
                      </Badge>
                    </div>

                    {/* Compact Stats */}
                    <div className="space-y-3 flex-1">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 p-2 bg-gray-700/30 rounded">
                          <Target className="h-3 w-3 text-blue-400" />
                          <span className="text-gray-300">{game.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-1 p-2 bg-gray-700/30 rounded">
                          <Clock className="h-3 w-3 text-green-400" />
                          <span className="text-gray-300">{game.duration}</span>
                        </div>
                        <div className="flex items-center gap-1 p-2 bg-gray-700/30 rounded">
                          <Zap className="h-3 w-3 text-yellow-400" />
                          <span className="text-gray-300">{game.xpReward}</span>
                        </div>
                        <div className="flex items-center gap-1 p-2 bg-gray-700/30 rounded">
                          <Gem className="h-3 w-3 text-purple-400" />
                          <span className="text-gray-300">{game.gemReward}</span>
                        </div>
                      </div>

                      {/* Compact Subjects */}
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Subjects:</div>
                        <div className="flex flex-wrap gap-1">
                          {game.subjects.slice(0, 2).map((subject, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-gray-700/30 border-gray-600 text-gray-300 px-2 py-0">
                              {subject}
                            </Badge>
                          ))}
                          {game.subjects.length > 2 && (
                            <Badge variant="outline" className="text-xs bg-gray-700/30 border-gray-600 text-gray-400 px-2 py-0">
                              +{game.subjects.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Age Range */}
                      <div className="text-xs text-gray-400">
                        Ages: <span className="text-gray-300">{game.ageRange}</span>
                      </div>
                    </div>

                    {/* Launch Button */}
                    <div className="mt-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          className={`w-full h-11 bg-gradient-to-r ${game.color} hover:opacity-90 transition-all duration-300 text-sm font-bold shadow-xl hover:shadow-2xl relative overflow-hidden border-2 border-white/20`}
                          onClick={() => launchGame(game.id)}
                        >
                          {/* Button Shine Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6 }}
                          />
                          <Play className="h-4 w-4 mr-2 relative z-10" />
                          <span className="relative z-10">Play Now</span>
                          <Sparkles className="h-4 w-4 ml-2 relative z-10" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No Results */}
        {filteredGames.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Games Found</h3>
            <p className="text-gray-300 mb-4">
              Try adjusting your search criteria or browse all games
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All Games')
                setSelectedDifficulty('All Levels')
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Show All Games
            </Button>
          </motion.div>
        )}

        {/* Footer - After all games */}
        {filteredGames.length > 0 && (
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Ready to Level Up?</h3>
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                
                <p className="text-base text-gray-300 max-w-xl mx-auto">
                  Master subjects through gaming and become a learning legend!
                </p>
                
                <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-400" />
                    <span>Safe & Secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span>Achievements</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users2 className="h-4 w-4 text-blue-400" />
                    <span>Multiplayer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    <span>AI-Powered</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-600/30">
                  <p className="text-sm text-gray-500">
                    © 2024 Catalyst Learning Platform
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

          </div>
        </main>
      </div>
    </div>
  )
}
