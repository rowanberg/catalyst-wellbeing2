'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  Wand2, 
  Star, 
  BookOpen, 
  Sparkles, 
  Crown,
  Scroll,
  Zap,
  Trophy,
  Target,
  Heart
} from 'lucide-react'
import { toast } from 'sonner'

interface Spell {
  id: string
  word: string
  definition: string
  difficulty: number
  category: string
  scrambled: string
  hint: string
}

interface Chapter {
  id: number
  title: string
  description: string
  spells: Spell[]
  unlocked: boolean
  completed: boolean
  emoji: string
}

interface WizardStats {
  level: number
  xp: number
  maxXp: number
  mana: number
  maxMana: number
  spellsLearned: number
  streak: number
  gems: number
  completedChapters: number
}

const SPELL_CATEGORIES = {
  'nature': ['forest', 'ocean', 'mountain', 'flower', 'thunder', 'rainbow', 'crystal', 'breeze'],
  'magic': ['enchant', 'mystic', 'wizard', 'potion', 'spell', 'charm', 'magic', 'wand'],
  'adventure': ['quest', 'treasure', 'dragon', 'castle', 'knight', 'sword', 'shield', 'brave'],
  'wisdom': ['knowledge', 'wisdom', 'learn', 'study', 'book', 'scroll', 'ancient', 'sage']
}

const DEFINITIONS = {
  'forest': 'A large area covered with trees and undergrowth',
  'ocean': 'A very large expanse of sea',
  'mountain': 'A large natural elevation of the earth\'s surface',
  'flower': 'The colorful part of a plant that produces seeds',
  'thunder': 'A loud rumbling sound that follows lightning',
  'rainbow': 'An arc of colors in the sky after rain',
  'crystal': 'A clear, transparent mineral or glass',
  'breeze': 'A gentle wind',
  'enchant': 'To cast a magical spell on something',
  'mystic': 'Having spiritual or magical significance',
  'wizard': 'A person with magical powers',
  'potion': 'A magical liquid with special effects',
  'spell': 'A magical formula or incantation',
  'charm': 'A magical object or spell for good luck',
  'magic': 'The power to make impossible things happen',
  'wand': 'A magical stick used by wizards',
  'quest': 'A long journey in search of something',
  'treasure': 'Valuable objects like gold and jewels',
  'dragon': 'A legendary fire-breathing creature',
  'castle': 'A large fortified building',
  'knight': 'A warrior in armor who serves a king',
  'sword': 'A weapon with a long metal blade',
  'shield': 'A protective barrier held in battle',
  'brave': 'Showing courage in the face of danger',
  'knowledge': 'Information and understanding gained through learning',
  'wisdom': 'The quality of having good judgment',
  'learn': 'To gain knowledge or skill',
  'study': 'To learn about something carefully',
  'book': 'A written work with pages bound together',
  'scroll': 'A roll of paper or parchment for writing',
  'ancient': 'Very old, from long ago',
  'sage': 'A wise person with great knowledge'
}

const scrambleWord = (word: string): string => {
  const letters = word.split('')
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }
  return letters.join('')
}

const generateSpell = (word: string, category: string, difficulty: number): Spell => {
  return {
    id: Math.random().toString(),
    word: word.toLowerCase(),
    definition: DEFINITIONS[word as keyof typeof DEFINITIONS] || 'A magical word of power',
    difficulty,
    category,
    scrambled: scrambleWord(word),
    hint: `This ${category} spell has ${word.length} letters`
  }
}

const generateChapters = (): Chapter[] => {
  const chapters: Chapter[] = []
  const categories = Object.keys(SPELL_CATEGORIES)
  
  categories.forEach((category, index) => {
    const words = SPELL_CATEGORIES[category as keyof typeof SPELL_CATEGORIES]
    const spells = words.map((word, wordIndex) => 
      generateSpell(word, category, Math.floor(wordIndex / 2) + 1)
    )
    
    chapters.push({
      id: index + 1,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Spells`,
      description: `Master the ancient art of ${category} magic`,
      spells,
      unlocked: index === 0,
      completed: false,
      emoji: ['🌿', '✨', '⚔️', '📚'][index]
    })
  })
  
  return chapters
}

export function WordWizardAcademy() {
  const [gameState, setGameState] = useState<'menu' | 'chapter' | 'spell' | 'victory'>('menu')
  const [wizardStats, setWizardStats] = useState<WizardStats>({
    level: 1,
    xp: 0,
    maxXp: 100,
    mana: 100,
    maxMana: 100,
    spellsLearned: 0,
    streak: 0,
    gems: 0,
    completedChapters: 0
  })
  const [chapters, setChapters] = useState<Chapter[]>(generateChapters())
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [currentSpell, setCurrentSpell] = useState<Spell | null>(null)
  const [currentSpellIndex, setCurrentSpellIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [spellEffect, setSpellEffect] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerActive) {
      handleTimeUp()
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeLeft, isTimerActive])

  const startChapter = (chapterId: number) => {
    const chapter = chapters.find(c => c.id === chapterId)
    if (!chapter || !chapter.unlocked) return
    
    setCurrentChapter(chapter)
    setCurrentSpellIndex(0)
    setCurrentSpell(chapter.spells[0])
    setGameState('spell')
    setUserInput('')
    setShowHint(false)
    setAttempts(0)
    setTimeLeft(60)
    setIsTimerActive(true)
  }

  const handleSpellCast = () => {
    if (!currentSpell) return
    
    const userAnswer = userInput.toLowerCase().trim()
    const correctAnswer = currentSpell.word.toLowerCase()
    
    setIsTimerActive(false)
    
    if (userAnswer === correctAnswer) {
      handleCorrectSpell()
    } else {
      handleIncorrectSpell()
    }
  }

  const handleCorrectSpell = () => {
    if (!currentSpell || !currentChapter) return
    
    const baseXp = currentSpell.difficulty * 20
    const timeBonus = Math.floor(timeLeft / 10) * 5
    const streakBonus = wizardStats.streak * 2
    const totalXp = baseXp + timeBonus + streakBonus
    const gemsEarned = currentSpell.difficulty + (attempts === 0 ? 2 : 0)
    
    setWizardStats(prev => {
      const newXp = prev.xp + totalXp
      const levelUp = newXp >= prev.maxXp
      
      return {
        ...prev,
        xp: levelUp ? newXp - prev.maxXp : newXp,
        level: levelUp ? prev.level + 1 : prev.level,
        maxXp: levelUp ? prev.maxXp + 50 : prev.maxXp,
        maxMana: levelUp ? prev.maxMana + 20 : prev.maxMana,
        mana: levelUp ? prev.maxMana + 20 : prev.mana,
        spellsLearned: prev.spellsLearned + 1,
        streak: prev.streak + 1,
        gems: prev.gems + gemsEarned
      }
    })
    
    // Spell effect animation
    const effects = ['✨ Sparkles!', '🌟 Brilliant!', '⚡ Lightning!', '🔥 Blazing!', '💫 Cosmic!']
    setSpellEffect(effects[Math.floor(Math.random() * effects.length)])
    
    setTimeout(() => {
      setSpellEffect(null)
      nextSpell()
    }, 2000)
    
    toast.success(`Perfect spell! +${totalXp} XP, +${gemsEarned} gems`)
  }

  const handleIncorrectSpell = () => {
    setAttempts(prev => prev + 1)
    setWizardStats(prev => ({ ...prev, streak: 0 }))
    
    if (attempts >= 2) {
      toast.error(`The spell was "${currentSpell?.word}". Try the next one!`)
      setTimeout(() => nextSpell(), 2000)
    } else {
      setShowHint(true)
      setTimeLeft(30) // Give more time after wrong attempt
      setIsTimerActive(true)
      toast.error('Spell failed! Try again with the hint.')
    }
  }

  const handleTimeUp = () => {
    setWizardStats(prev => ({ ...prev, streak: 0 }))
    toast.error(`Time's up! The spell was "${currentSpell?.word}"`)
    setTimeout(() => nextSpell(), 2000)
  }

  const nextSpell = () => {
    if (!currentChapter) return
    
    const nextIndex = currentSpellIndex + 1
    
    if (nextIndex >= currentChapter.spells.length) {
      completeChapter()
    } else {
      setCurrentSpellIndex(nextIndex)
      setCurrentSpell(currentChapter.spells[nextIndex])
      setUserInput('')
      setShowHint(false)
      setAttempts(0)
      setTimeLeft(60)
      setIsTimerActive(true)
    }
  }

  const completeChapter = () => {
    if (!currentChapter) return
    
    setChapters(prev => prev.map(chapter => {
      if (chapter.id === currentChapter.id) {
        return { ...chapter, completed: true }
      }
      if (chapter.id === currentChapter.id + 1) {
        return { ...chapter, unlocked: true }
      }
      return chapter
    }))
    
    setWizardStats(prev => ({
      ...prev,
      completedChapters: prev.completedChapters + 1,
      gems: prev.gems + 50
    }))
    
    setGameState('victory')
    toast.success(`Chapter completed! +50 bonus gems!`)
  }

  const resetToMenu = () => {
    setGameState('menu')
    setCurrentChapter(null)
    setCurrentSpell(null)
    setIsTimerActive(false)
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
              🧙‍♂️ Word Wizard Academy
            </h1>
            <p className="text-xl text-gray-300">Master the ancient art of spelling and vocabulary magic!</p>
          </motion.div>

          {/* Wizard Stats */}
          <Card className="mb-8 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Crown className="h-6 w-6 text-yellow-400" />
                Wizard Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">Lv.{wizardStats.level}</div>
                  <div className="text-sm text-gray-300">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{wizardStats.mana}/{wizardStats.maxMana}</div>
                  <div className="text-sm text-gray-300">Mana</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{wizardStats.spellsLearned}</div>
                  <div className="text-sm text-gray-300">Spells</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{wizardStats.streak}</div>
                  <div className="text-sm text-gray-300">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{wizardStats.gems}</div>
                  <div className="text-sm text-gray-300">Gems</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>XP Progress</span>
                  <span>{wizardStats.xp}/{wizardStats.maxXp}</span>
                </div>
                <Progress value={(wizardStats.xp / wizardStats.maxXp) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Chapters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${
                  chapter.completed 
                    ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-400/30'
                    : chapter.unlocked
                    ? 'bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-400/30 hover:border-purple-400/60'
                    : 'bg-gradient-to-br from-gray-600/20 to-gray-700/20 border-gray-500/30'
                } transition-all cursor-pointer group`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                      {chapter.completed ? '✅' : chapter.unlocked ? chapter.emoji : '🔒'}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{chapter.title}</h3>
                    <p className="text-sm text-gray-300 mb-4">{chapter.description}</p>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between text-gray-300">
                        <span>Spells:</span>
                        <span className="text-purple-400">{chapter.spells.length}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Status:</span>
                        <Badge variant={chapter.completed ? 'default' : chapter.unlocked ? 'secondary' : 'outline'}>
                          {chapter.completed ? 'Complete' : chapter.unlocked ? 'Available' : 'Locked'}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      className={`w-full ${
                        chapter.completed
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                      }`}
                      onClick={() => startChapter(chapter.id)}
                      disabled={!chapter.unlocked}
                    >
                      {chapter.completed ? '🔄 Replay' : chapter.unlocked ? '📖 Study' : '🔒 Locked'}
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

  if (gameState === 'spell') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={resetToMenu} className="bg-gray-800/50">
              ← Back to Academy
            </Button>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">{currentChapter?.title}</h2>
              <div className="text-lg text-purple-300">
                Spell {currentSpellIndex + 1} of {currentChapter?.spells.length}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">⏰ {timeLeft}s</div>
              <div className="text-sm text-gray-300">Streak: {wizardStats.streak}</div>
            </div>
          </div>

          {/* Spell Effect */}
          <AnimatePresence>
            {spellEffect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <div className="text-8xl font-bold text-yellow-400 animate-pulse">
                  {spellEffect}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spell Book */}
          {currentSpell && (
            <Card className="mb-6 bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-400/30">
              <CardHeader>
                <CardTitle className="text-center text-white text-2xl flex items-center justify-center gap-2">
                  <Scroll className="h-8 w-8 text-amber-400" />
                  Ancient Spell Scroll
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="bg-parchment p-6 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-100 text-gray-800">
                    <div className="text-lg font-semibold mb-2">Definition:</div>
                    <div className="text-xl italic mb-4">"{currentSpell.definition}"</div>
                    
                    <div className="text-lg font-semibold mb-2">Scrambled Spell:</div>
                    <div className="text-4xl font-bold text-purple-600 tracking-widest mb-4">
                      {currentSpell.scrambled.toUpperCase()}
                    </div>
                    
                    {showHint && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-100 p-3 rounded border-l-4 border-blue-500"
                      >
                        <div className="text-sm font-semibold text-blue-700">Hint:</div>
                        <div className="text-blue-600">{currentSpell.hint}</div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex gap-4 justify-center items-center">
                    <Input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Cast your spell..."
                      className="text-center text-xl font-bold w-64 bg-white/90"
                      onKeyPress={(e) => e.key === 'Enter' && handleSpellCast()}
                    />
                    <Button 
                      onClick={handleSpellCast}
                      disabled={!userInput.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8"
                    >
                      <Wand2 className="h-5 w-5 mr-2" />
                      Cast Spell!
                    </Button>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      Difficulty: {currentSpell.difficulty}/5 ⭐
                    </Badge>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      Attempts: {attempts}/3
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          <Card className="bg-gray-900/50 border-gray-600/30">
            <CardContent className="p-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Chapter Progress</span>
                <span>{currentSpellIndex + 1}/{currentChapter?.spells.length}</span>
              </div>
              <Progress 
                value={((currentSpellIndex + 1) / (currentChapter?.spells.length || 1)) * 100} 
                className="h-3" 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-400/30 p-8">
            <CardContent>
              <div className="text-8xl mb-6">🎓</div>
              <h2 className="text-4xl font-bold text-green-400 mb-4">CHAPTER MASTERED!</h2>
              <p className="text-xl text-white mb-6">
                You have successfully completed {currentChapter?.title}!
              </p>
              
              <div className="space-y-2 mb-8 text-lg text-gray-300">
                <div>🧙‍♂️ Spells Learned: {currentChapter?.spells.length}</div>
                <div>💎 Bonus Gems: +50</div>
                <div>📚 Next Chapter Unlocked!</div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={resetToMenu}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8"
                >
                  🏠 Back to Academy
                </Button>
                <Button 
                  onClick={() => {
                    const nextChapter = chapters.find(c => c.id === (currentChapter?.id || 0) + 1)
                    if (nextChapter && nextChapter.unlocked) {
                      startChapter(nextChapter.id)
                    } else {
                      resetToMenu()
                    }
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8"
                >
                  📖 Next Chapter
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
