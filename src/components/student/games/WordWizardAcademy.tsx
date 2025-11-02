'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { useAppSelector } from '@/lib/redux/hooks'
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
  Heart,
  Volume2,
  VolumeX,
  Flame,
  Snowflake,
  Wind,
  Waves,
  Save,
  Loader2
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

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface SoundSettings {
  enabled: boolean
  volume: number
}

const SPELL_CATEGORIES = {
  'nature': ['forest', 'ocean', 'mountain', 'flower', 'thunder', 'rainbow', 'crystal', 'breeze', 'waterfall', 'meadow', 'glacier', 'volcano', 'aurora', 'constellation'],
  'magic': ['enchant', 'mystic', 'wizard', 'potion', 'spell', 'charm', 'magic', 'wand', 'sorcery', 'incantation', 'alchemy', 'divination', 'transmutation', 'illusion'],
  'adventure': ['quest', 'treasure', 'dragon', 'castle', 'knight', 'sword', 'shield', 'brave', 'expedition', 'labyrinth', 'guardian', 'artifact', 'champion', 'legend'],
  'wisdom': ['knowledge', 'wisdom', 'learn', 'study', 'book', 'scroll', 'ancient', 'sage', 'philosophy', 'enlightenment', 'meditation', 'understanding', 'intellect', 'scholar'],
  'elements': ['fire', 'water', 'earth', 'wind', 'lightning', 'ice', 'shadow', 'light', 'plasma', 'gravity', 'magnetism', 'energy', 'void', 'cosmos'],
  'creatures': ['phoenix', 'unicorn', 'griffin', 'basilisk', 'chimera', 'kraken', 'sphinx', 'pegasus', 'hydra', 'leviathan', 'behemoth', 'wyvern', 'manticore', 'cerberus'],
  'technology': ['algorithm', 'quantum', 'digital', 'network', 'database', 'encryption', 'artificial', 'virtual', 'cybernetic', 'holographic', 'nanotechnology', 'biotechnology', 'robotics', 'automation'],
  'emotions': ['courage', 'compassion', 'serenity', 'determination', 'empathy', 'resilience', 'harmony', 'tranquility', 'euphoria', 'melancholy', 'nostalgia', 'exhilaration', 'contemplation', 'jubilation'],
  'science': ['molecule', 'electron', 'photon', 'neutron', 'catalyst', 'synthesis', 'hypothesis', 'experiment', 'observation', 'analysis', 'microscope', 'telescope', 'laboratory', 'discovery'],
  'space': ['galaxy', 'nebula', 'asteroid', 'comet', 'supernova', 'blackhole', 'satellite', 'orbit', 'planetary', 'interstellar', 'cosmic', 'celestial', 'astronaut', 'spacecraft']
}

const DEFINITIONS = {
  // Nature
  'forest': 'A large area covered with trees and undergrowth',
  'ocean': 'A very large expanse of sea',
  'mountain': 'A large natural elevation of the earth\'s surface',
  'flower': 'The colorful part of a plant that produces seeds',
  'thunder': 'A loud rumbling sound that follows lightning',
  'rainbow': 'An arc of colors in the sky after rain',
  'crystal': 'A clear, transparent mineral or glass',
  'breeze': 'A gentle wind',
  'waterfall': 'Water falling from a height, forming a cascade',
  'meadow': 'A piece of grassland, especially one used for hay',
  'glacier': 'A slowly moving mass or river of ice',
  'volcano': 'A mountain with a crater that can erupt lava',
  'aurora': 'Natural light display in polar skies',
  'constellation': 'A group of stars forming a recognizable pattern',
  
  // Magic
  'enchant': 'To cast a magical spell on something',
  'mystic': 'Having spiritual or magical significance',
  'wizard': 'A person with magical powers',
  'potion': 'A magical liquid with special effects',
  'spell': 'A magical formula or incantation',
  'charm': 'A magical object or spell for good luck',
  'magic': 'The power to make impossible things happen',
  'wand': 'A magical stick used by wizards',
  'sorcery': 'The practice of magic, especially black magic',
  'incantation': 'A series of words said as a magic spell',
  'alchemy': 'Medieval chemistry and magic',
  'divination': 'The practice of seeking knowledge of the future',
  'transmutation': 'The changing of one element into another',
  'illusion': 'Something that appears real but is not',
  
  // Adventure
  'quest': 'A long journey in search of something',
  'treasure': 'Valuable objects like gold and jewels',
  'dragon': 'A legendary fire-breathing creature',
  'castle': 'A large fortified building',
  'knight': 'A warrior in armor who serves a king',
  'sword': 'A weapon with a long metal blade',
  'shield': 'A protective barrier held in battle',
  'brave': 'Showing courage in the face of danger',
  'expedition': 'A journey undertaken for a specific purpose',
  'labyrinth': 'A complicated network of paths or passages',
  'guardian': 'A defender, protector, or keeper',
  'artifact': 'An object made by a human being of historical interest',
  'champion': 'A person who fights for a cause or on behalf of others',
  'legend': 'A traditional story sometimes regarded as historical',
  
  // Wisdom
  'knowledge': 'Information and understanding gained through learning',
  'wisdom': 'The quality of having good judgment',
  'learn': 'To gain knowledge or skill',
  'study': 'To learn about something carefully',
  'book': 'A written work with pages bound together',
  'scroll': 'A roll of paper or parchment for writing',
  'ancient': 'Very old, from long ago',
  'sage': 'A wise person with great knowledge',
  'philosophy': 'The study of fundamental nature of knowledge and existence',
  'enlightenment': 'The state of having knowledge or understanding',
  'meditation': 'The practice of focusing the mind for spiritual purposes',
  'understanding': 'The ability to comprehend something',
  'intellect': 'The faculty of reasoning and understanding',
  'scholar': 'A specialist in a particular branch of study',
  
  // Elements
  'fire': 'The phenomenon of combustion manifested in light and heat',
  'water': 'A transparent liquid that forms seas, lakes, and rivers',
  'earth': 'The planet on which we live; soil or land',
  'wind': 'The natural movement of air',
  'lightning': 'A high-voltage electrical discharge in the atmosphere',
  'ice': 'Frozen water, a brittle transparent crystalline solid',
  'shadow': 'A dark area where light is blocked',
  'light': 'Natural agent that makes things visible',
  'plasma': 'An ionized gas consisting of positive ions and free electrons',
  'gravity': 'The force that attracts objects toward each other',
  'magnetism': 'A physical phenomenon produced by moving electric charge',
  'energy': 'The capacity for doing work',
  'void': 'A completely empty space',
  'cosmos': 'The universe seen as a well-ordered whole',
  
  // Creatures
  'phoenix': 'A mythical bird that rises from its own ashes',
  'unicorn': 'A mythical horse-like creature with a single horn',
  'griffin': 'A legendary creature with eagle head and lion body',
  'basilisk': 'A legendary reptile whose gaze could kill',
  'chimera': 'A fire-breathing creature with lion, goat, and serpent parts',
  'kraken': 'A legendary sea monster of enormous size',
  'sphinx': 'A creature with human head and lion body',
  'pegasus': 'A divine winged horse in Greek mythology',
  'hydra': 'A water monster with many heads',
  'leviathan': 'A sea monster of enormous size',
  'behemoth': 'A huge or monstrous creature',
  'wyvern': 'A winged two-legged dragon',
  'manticore': 'A creature with human head, lion body, and scorpion tail',
  'cerberus': 'A three-headed dog guarding the underworld',
  
  // Technology
  'algorithm': 'A set of rules for solving problems in computing',
  'quantum': 'Relating to quantum mechanics and physics',
  'digital': 'Relating to computer technology',
  'network': 'A group of interconnected computers or systems',
  'database': 'A structured set of data held in a computer',
  'encryption': 'The process of converting information into code',
  'artificial': 'Made by humans rather than occurring naturally',
  'virtual': 'Existing in essence but not in physical form',
  'cybernetic': 'Relating to the science of communications and control',
  'holographic': 'Relating to three-dimensional images formed by light',
  'nanotechnology': 'Technology on an atomic or molecular scale',
  'biotechnology': 'Technology based on biology and living systems',
  'robotics': 'The design and use of robots',
  'automation': 'The use of machines to do work automatically',
  
  // Emotions
  'courage': 'The ability to do something frightening',
  'compassion': 'Sympathetic concern for the sufferings of others',
  'serenity': 'The state of being calm and peaceful',
  'determination': 'Firmness of purpose and resolve',
  'empathy': 'The ability to understand others\' feelings',
  'resilience': 'The capacity to recover quickly from difficulties',
  'harmony': 'The combination of different elements in a pleasing way',
  'tranquility': 'The quality of being peaceful and calm',
  'euphoria': 'A feeling of intense excitement and happiness',
  'melancholy': 'A thoughtful sadness',
  'nostalgia': 'A sentimental longing for the past',
  'exhilaration': 'A feeling of excitement and elation',
  'contemplation': 'Deep reflective thought',
  'jubilation': 'A feeling of great happiness and triumph',
  
  // Science
  'molecule': 'A group of atoms bonded together',
  'electron': 'A negatively charged subatomic particle',
  'photon': 'A particle representing a quantum of light',
  'neutron': 'A subatomic particle with no electric charge',
  'catalyst': 'A substance that increases the rate of a chemical reaction',
  'synthesis': 'The combination of components to form a connected whole',
  'hypothesis': 'A proposed explanation for a phenomenon',
  'experiment': 'A scientific procedure to test a hypothesis',
  'observation': 'The action of watching something carefully',
  'analysis': 'Detailed examination of elements or structure',
  'microscope': 'An instrument for viewing very small objects',
  'telescope': 'An instrument for observing distant objects',
  'laboratory': 'A room equipped for scientific experiments',
  'discovery': 'The action of finding something for the first time',
  
  // Space
  'galaxy': 'A system of millions of stars held together by gravity',
  'nebula': 'A cloud of gas and dust in outer space',
  'asteroid': 'A rocky object orbiting the sun',
  'comet': 'An icy object that develops a tail when near the sun',
  'supernova': 'A stellar explosion that briefly outshines an entire galaxy',
  'blackhole': 'A region of space with gravitational field so strong nothing can escape',
  'satellite': 'An object that orbits around a larger object',
  'orbit': 'The curved path of an object around a star or planet',
  'planetary': 'Relating to planets',
  'interstellar': 'Occurring between stars',
  'cosmic': 'Relating to the universe or cosmos',
  'celestial': 'Relating to the sky or outer space',
  'astronaut': 'A person trained to travel in spacecraft',
  'spacecraft': 'A vehicle designed for travel in outer space'
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
  const categoryEmojis = {
    'nature': '🌿',
    'magic': '✨',
    'adventure': '⚔️',
    'wisdom': '📚',
    'elements': '🔥',
    'creatures': '🐉',
    'technology': '🤖',
    'emotions': '💝',
    'science': '🔬',
    'space': '🚀'
  }
  
  const categoryDescriptions = {
    'nature': 'Master the ancient art of nature magic',
    'magic': 'Discover the secrets of mystical spells',
    'adventure': 'Embark on epic quests and adventures',
    'wisdom': 'Unlock the power of knowledge and learning',
    'elements': 'Command the fundamental forces of nature',
    'creatures': 'Summon legendary beasts and mythical beings',
    'technology': 'Harness the power of advanced technology',
    'emotions': 'Channel the energy of human feelings',
    'science': 'Explore the mysteries of scientific discovery',
    'space': 'Journey through the cosmos and beyond'
  }
  
  categories.forEach((category, index) => {
    const words = SPELL_CATEGORIES[category as keyof typeof SPELL_CATEGORIES]
    const spells = words.map((word, wordIndex) => 
      generateSpell(word, category, Math.floor(wordIndex / 3) + 1)
    )
    
    chapters.push({
      id: index + 1,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Spells`,
      description: categoryDescriptions[category as keyof typeof categoryDescriptions],
      spells,
      unlocked: index === 0,
      completed: false,
      emoji: categoryEmojis[category as keyof typeof categoryEmojis]
    })
  })
  
  return chapters
}

// Particle System Component
const ParticleSystem = ({ particles }: { particles: Particle[] }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life / particle.maxLife,
          }}
          animate={{
            x: particle.x + particle.vx * 100,
            y: particle.y + particle.vy * 100,
            scale: [1, 1.5, 0],
          }}
          transition={{
            duration: particle.maxLife / 1000,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )
}

// Enhanced Spell Effect Component
const SpellEffectDisplay = ({ effect, category }: { effect: string | null, category?: string }) => {
  const getEffectColor = (cat?: string) => {
    const colors = {
      nature: 'text-green-400',
      magic: 'text-purple-400',
      adventure: 'text-orange-400',
      wisdom: 'text-blue-400',
      elements: 'text-red-400',
      creatures: 'text-yellow-400',
      technology: 'text-cyan-400',
      emotions: 'text-pink-400',
      science: 'text-indigo-400',
      space: 'text-violet-400'
    }
    return colors[cat as keyof typeof colors] || 'text-yellow-400'
  }

  return (
    <AnimatePresence>
      {effect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
          animate={{ 
            opacity: 1, 
            scale: [0.5, 1.2, 1], 
            rotate: [0, 360, 720],
            y: [-20, -40, -20]
          }}
          exit={{ opacity: 0, scale: 0.5, y: -100 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <div className={`text-6xl sm:text-8xl font-bold ${getEffectColor(category)} animate-pulse drop-shadow-2xl`}>
            {effect}
          </div>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: [-1000, 1000] }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function WordWizardAcademy() {
  const { user } = useAppSelector((state) => state.auth)
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
  const [particles, setParticles] = useState<Particle[]>([])
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({ enabled: true, volume: 0.5 })
  const [isShaking, setIsShaking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [chapterStartTime, setChapterStartTime] = useState<number>(0)

  const timerRef = useRef<NodeJS.Timeout>()
  const particleIdRef = useRef(0)
  const controls = useAnimation()

  // Particle system functions
  const createParticles = useCallback((x: number, y: number, count: number = 10, colors: string[] = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1']) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 2000,
        maxLife: 2000,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4
      })
    }
    setParticles(prev => [...prev, ...newParticles])
    
    // Clean up particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)))
    }, 2500)
  }, [])

  const playSound = useCallback((type: 'success' | 'error' | 'cast' | 'complete') => {
    if (!soundSettings.enabled) return
    
    // Create audio context for sound effects
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      const frequencies = {
        success: [523, 659, 784], // C, E, G
        error: [220, 185], // A, F#
        cast: [440, 554], // A, C#
        complete: [523, 659, 784, 1047] // C, E, G, C
      }
      
      const freq = frequencies[type]
      freq.forEach((f, i) => {
        setTimeout(() => {
          oscillator.frequency.setValueAtTime(f, audioContext.currentTime)
        }, i * 100)
      })
      
      gainNode.gain.setValueAtTime(soundSettings.volume * 0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('Audio not supported')
    }
  }, [soundSettings])

  const triggerShake = useCallback(() => {
    setIsShaking(true)
    controls.start({
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    })
    setTimeout(() => setIsShaking(false), 500)
  }, [controls])

  // Database functions
  const saveProgress = useCallback(async (chapterId: number, spellsCompleted: number, totalSpells: number, xpEarned: number, gemsEarned: number) => {
    if (!user) return

    setIsSaving(true)
    try {
      const timeSpent = Math.floor((Date.now() - chapterStartTime) / 1000)
      
      const response = await fetch('/api/student/word-wizard/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId,
          spellsCompleted,
          totalSpells,
          xpEarned,
          gemsEarned,
          timeSpent,
          difficulty: currentSpell?.difficulty || 1,
          category: currentChapter?.title.split(' ')[0].toLowerCase() || 'general'
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        if (data.pointsAdded > 0) {
          toast.success(`Progress saved! +${data.pointsAdded} points added to your wallet!`)
        } else {
          toast.success('Progress saved!')
        }
      } else {
        toast.error('Failed to save progress')
      }
    } catch (error) {
      console.error('Error saving progress:', error)
      toast.error('Failed to save progress')
    } finally {
      setIsSaving(false)
    }
  }, [user, chapterStartTime, currentSpell, currentChapter])

  const loadProgress = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/student/word-wizard/progress')
      const data = await response.json()
      
      if (data.success) {
        // Update chapters with progress data
        setChapters(prevChapters => {
          return prevChapters.map(chapter => {
            const progress = data.progress.find((p: any) => p.chapter_id === chapter.id)
            if (progress) {
              return {
                ...chapter,
                completed: progress.is_completed,
                unlocked: true // If there's progress, it should be unlocked
              }
            }
            return chapter
          })
        })

        // Update wizard stats based on total progress
        const totalXP = data.progress.reduce((sum: number, p: any) => sum + (p.xp_earned || 0), 0)
        const totalGems = data.progress.reduce((sum: number, p: any) => sum + (p.gems_earned || 0), 0)
        const completedChapters = data.progress.filter((p: any) => p.is_completed).length
        
        setWizardStats(prev => ({
          ...prev,
          xp: totalXP % prev.maxXp,
          level: Math.floor(totalXP / 100) + 1,
          gems: totalGems,
          completedChapters,
          spellsLearned: data.progress.reduce((sum: number, p: any) => sum + (p.spells_completed || 0), 0)
        }))
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }, [user])

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

  // Load progress on component mount
  useEffect(() => {
    if (user) {
      loadProgress()
    }
  }, [user, loadProgress])

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
    setChapterStartTime(Date.now()) // Track start time for progress saving
  }

  const handleSpellCast = () => {
    if (!currentSpell) return
    
    const userAnswer = userInput.toLowerCase().trim()
    const correctAnswer = currentSpell.word.toLowerCase()
    
    setIsTimerActive(false)
    playSound('cast')
    
    // Create particles at button location
    const buttonElement = document.querySelector('[data-spell-cast-button]')
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect()
      createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 15)
    }
    
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
    
    // Play success sound and create celebration particles
    playSound('success')
    createParticles(window.innerWidth / 2, window.innerHeight / 2, 25, ['#FFD700', '#00FF00', '#FF69B4', '#00BFFF'])
    
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
    
    // Enhanced spell effect animation with category-specific effects
    const categoryEffects = {
      nature: ['🌿 Nature\'s Blessing!', '🌸 Bloom!', '🌊 Tidal Wave!'],
      magic: ['✨ Mystical Power!', '🔮 Arcane Mastery!', '⭐ Stellar Magic!'],
      adventure: ['⚔️ Victory!', '🏆 Triumph!', '🛡️ Heroic!'],
      wisdom: ['📚 Enlightened!', '🧠 Brilliant!', '💡 Genius!'],
      elements: ['🔥 Elemental!', '⚡ Energized!', '❄️ Crystalline!'],
      creatures: ['🐉 Legendary!', '🦄 Mythical!', '🔥 Phoenix Rise!'],
      technology: ['🤖 Digital!', '💻 Quantum!', '🚀 Cyber!'],
      emotions: ['💖 Harmony!', '🌟 Euphoric!', '💫 Serene!'],
      science: ['🔬 Discovery!', '⚗️ Synthesis!', '🧪 Eureka!'],
      space: ['🌌 Cosmic!', '⭐ Stellar!', '🚀 Galactic!']
    }
    
    const effects = categoryEffects[currentSpell.category as keyof typeof categoryEffects] || ['✨ Magical!']
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
    
    // Play error sound and trigger shake effect
    playSound('error')
    triggerShake()
    
    // Create red particles for failure
    createParticles(window.innerWidth / 2, window.innerHeight / 2, 10, ['#FF0000', '#FF4444', '#CC0000'])
    
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

  const completeChapter = async () => {
    if (!currentChapter) return
    
    // Play completion sound and create massive celebration
    playSound('complete')
    createParticles(window.innerWidth / 2, window.innerHeight / 2, 50, ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32', '#FF6347'])
    
    const totalXpEarned = currentChapter.spells.reduce((sum, spell) => sum + (spell.difficulty * 20), 0)
    const totalGemsEarned = 50 + currentChapter.spells.reduce((sum, spell) => sum + spell.difficulty, 0)
    
    // Save progress to database
    await saveProgress(
      currentChapter.id,
      currentChapter.spells.length,
      currentChapter.spells.length,
      totalXpEarned,
      totalGemsEarned
    )
    
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
      gems: prev.gems + totalGemsEarned
    }))
    
    setGameState('victory')
    toast.success(`Chapter completed! +${totalGemsEarned} gems earned!`)
  }

  const resetToMenu = () => {
    setGameState('menu')
    setCurrentChapter(null)
    setCurrentSpell(null)
    setIsTimerActive(false)
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-4 relative overflow-hidden">
        {/* Student-Friendly Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-20 left-10 w-32 h-32 bg-yellow-300/30 rounded-full blur-xl"
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-40 right-20 w-24 h-24 bg-pink-300/30 rounded-full blur-xl"
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 left-1/3 w-40 h-40 bg-green-300/30 rounded-full blur-xl"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.3, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          {/* Fun decorative elements */}
          <div className="absolute top-32 right-32 text-6xl opacity-20 animate-bounce">⭐</div>
          <div className="absolute bottom-32 left-20 text-4xl opacity-20 animate-pulse">🌟</div>
          <div className="absolute top-1/2 right-10 text-5xl opacity-20 animate-spin" style={{ animationDuration: '8s' }}>✨</div>
        </div>
        
        <ParticleSystem particles={particles} />
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.h1 
              className="text-5xl sm:text-6xl font-bold text-gray-800 mb-4 drop-shadow-lg"
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-6xl sm:text-7xl">🧙‍♂️</span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Word Wizard Academy
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl sm:text-2xl text-gray-700 font-medium mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              🌟 Master spelling and vocabulary through magical adventures! ✨
            </motion.p>
            
            {/* Sound Toggle */}
            <motion.div 
              className="absolute top-4 right-4"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className="bg-white/90 border-gray-300 text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-200"
              >
                {soundSettings.enabled ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm font-medium">Sound On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-sm font-medium">Sound Off</span>
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>

          {/* Wizard Stats */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Crown className="h-7 w-7 text-yellow-300" />
                Your Wizard Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-1">Lv.{wizardStats.level}</div>
                  <div className="text-sm font-medium text-purple-700">Level</div>
                </div>
                <div className="text-center bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{wizardStats.mana}/{wizardStats.maxMana}</div>
                  <div className="text-sm font-medium text-blue-700">Mana</div>
                </div>
                <div className="text-center bg-green-50 p-4 rounded-xl border-2 border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">{wizardStats.spellsLearned}</div>
                  <div className="text-sm font-medium text-green-700">Spells</div>
                </div>
                <div className="text-center bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{wizardStats.streak}</div>
                  <div className="text-sm font-medium text-orange-700">Streak</div>
                </div>
                <div className="text-center bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">{wizardStats.gems}</div>
                  <div className="text-sm font-medium text-yellow-700">Gems</div>
                </div>
              </div>
              <div className="mt-6 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>XP Progress to Next Level</span>
                  <span>{wizardStats.xp}/{wizardStats.maxXp}</span>
                </div>
                <Progress 
                  value={(wizardStats.xp / wizardStats.maxXp) * 100} 
                  className="h-3 bg-gray-200"
                />
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
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300 shadow-lg'
                    : chapter.unlocked
                    ? 'bg-gradient-to-br from-white to-purple-50 border-2 border-purple-300 hover:border-purple-400 hover:shadow-xl'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300'
                } transition-all duration-300 cursor-pointer group`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                      {chapter.completed ? '✅' : chapter.unlocked ? chapter.emoji : '🔒'}
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${
                      chapter.completed ? 'text-green-800' : chapter.unlocked ? 'text-gray-800' : 'text-gray-600'
                    }`}>{chapter.title}</h3>
                    <p className={`text-sm mb-4 ${
                      chapter.completed ? 'text-green-700' : chapter.unlocked ? 'text-gray-700' : 'text-gray-500'
                    }`}>{chapter.description}</p>
                    <div className="space-y-3 text-sm mb-6">
                      <div className={`flex justify-between items-center p-2 rounded-lg ${
                        chapter.completed ? 'bg-green-50 border border-green-200' : 
                        chapter.unlocked ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <span className="font-medium">Spells:</span>
                        <span className={`font-bold ${
                          chapter.completed ? 'text-green-600' : chapter.unlocked ? 'text-purple-600' : 'text-gray-600'
                        }`}>{chapter.spells.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Status:</span>
                        <Badge 
                          variant={chapter.completed ? 'default' : chapter.unlocked ? 'secondary' : 'outline'}
                          className={`${
                            chapter.completed ? 'bg-green-100 text-green-800 border-green-300' :
                            chapter.unlocked ? 'bg-purple-100 text-purple-800 border-purple-300' :
                            'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {chapter.completed ? '✅ Complete' : chapter.unlocked ? '🎯 Available' : '🔒 Locked'}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      className={`w-full h-12 text-base font-semibold shadow-lg transition-all duration-200 ${
                        chapter.completed
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                          : chapter.unlocked
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      onClick={() => startChapter(chapter.id)}
                      disabled={!chapter.unlocked}
                    >
                      {chapter.completed ? '🔄 Play Again' : chapter.unlocked ? '🎮 Start Adventure' : '🔒 Locked'}
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
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-4 relative overflow-hidden"
        animate={controls}
      >
        {/* Dynamic Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-10 left-10 w-20 h-20 bg-yellow-500/30 rounded-full blur-lg"
            animate={{ 
              x: [0, 200, 0],
              y: [0, -100, 0],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 right-20 w-32 h-32 bg-pink-500/20 rounded-full blur-xl"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <ParticleSystem particles={particles} />
        <SpellEffectDisplay effect={spellEffect} category={currentSpell?.category} />
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border-2 border-purple-200">
            <Button 
              variant="outline" 
              onClick={resetToMenu} 
              className="w-full sm:w-auto bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200 h-10"
            >
              <span className="text-sm sm:text-base">← Back to Academy</span>
            </Button>
            <div className="text-center flex-1">
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1">{currentChapter?.title}</h2>
              <div className="text-sm sm:text-base lg:text-lg text-purple-600 font-medium">
                Spell {currentSpellIndex + 1} of {currentChapter?.spells.length}
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-1">⏰ {timeLeft}s</div>
              <div className="text-xs sm:text-sm font-medium text-gray-700">🔥 Streak: {wizardStats.streak}</div>
              {isSaving && (
                <div className="flex items-center justify-center sm:justify-end gap-1 text-xs text-blue-600 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="font-medium">Saving...</span>
                </div>
              )}
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

          {/* Spell Book - Mobile Optimized */}
          {currentSpell && (
            <Card className="mb-4 sm:mb-6 bg-white/95 backdrop-blur-sm border-2 border-amber-300 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-t-lg p-4 sm:p-6">
                <CardTitle className="text-center text-lg sm:text-2xl flex items-center justify-center gap-2 sm:gap-3">
                  <Scroll className="h-8 w-8 text-white" />
                  Magic Spell Scroll
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 sm:p-6 rounded-xl border-2 border-amber-200 shadow-inner">
                    <div className="text-base sm:text-lg font-bold mb-3 text-amber-800">📖 What does this word mean?</div>
                    <div className="text-xl font-medium mb-6 text-gray-800 bg-white p-4 rounded-lg border border-amber-200">
                      "{currentSpell.definition}"
                    </div>
                    
                    <div className="text-lg font-bold mb-3 text-purple-800">🔤 Unscramble the letters:</div>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600 tracking-wider mb-6 bg-white p-3 sm:p-4 rounded-lg border-2 border-purple-200 shadow-sm">
                      {currentSpell.scrambled.toUpperCase()}
                    </div>
                    
                    {showHint && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200"
                      >
                        <div className="text-base font-bold text-blue-800 mb-2">💡 Hint:</div>
                        <div className="text-blue-700 font-medium">{currentSpell.hint}</div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                    <div className="w-full sm:w-80">
                      <Input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type your answer here..."
                        className="text-center text-lg sm:text-xl font-bold bg-white border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl h-12 sm:h-14 shadow-lg"
                        onKeyPress={(e) => e.key === 'Enter' && handleSpellCast()}
                      />
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto"
                    >
                      <Button 
                        onClick={handleSpellCast}
                        disabled={!userInput.trim()}
                        data-spell-cast-button
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-white shadow-xl rounded-xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed h-12 sm:h-14"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                          animate={{ x: [-100, 300] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <Wand2 className="h-5 sm:h-6 w-5 sm:w-6 mr-2 relative z-10" />
                        <span className="relative z-10 text-sm sm:text-lg">✨ Cast Spell!</span>
                      </Button>
                    </motion.div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <Badge className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 bg-yellow-100 text-yellow-800 border-2 border-yellow-300 rounded-xl font-bold">
                      ⭐ Difficulty: {currentSpell.difficulty}/5
                    </Badge>
                    <Badge className={`text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold border-2 ${
                      attempts === 0 ? 'bg-green-100 text-green-800 border-green-300' :
                      attempts === 1 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                      'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      🎯 Attempts: {attempts}/3
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-indigo-200 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-center text-base font-bold text-gray-800 mb-3">
                <span>📚 Chapter Progress</span>
                <span className="text-indigo-600">{currentSpellIndex + 1}/{currentChapter?.spells.length}</span>
              </div>
              <Progress 
                value={((currentSpellIndex + 1) / (currentChapter?.spells.length || 1)) * 100} 
                className="h-4 bg-gray-200 rounded-full overflow-hidden"
              />
              <div className="text-center mt-3 text-sm font-medium text-gray-600">
                {Math.round(((currentSpellIndex + 1) / (currentChapter?.spells.length || 1)) * 100)}% Complete
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-4 flex items-center justify-center relative overflow-hidden">
        {/* Celebration Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 text-6xl opacity-30 animate-bounce">🎉</div>
          <div className="absolute top-32 right-32 text-5xl opacity-30 animate-pulse">⭐</div>
          <div className="absolute bottom-20 left-32 text-7xl opacity-30 animate-spin" style={{ animationDuration: '3s' }}>🏆</div>
          <div className="absolute bottom-32 right-20 text-4xl opacity-30 animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-green-300 shadow-2xl p-8 max-w-2xl">
            <CardContent>
              <motion.div 
                className="text-8xl mb-6"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎓
              </motion.div>
              <h2 className="text-4xl sm:text-5xl font-bold text-green-600 mb-4">
                🎉 CHAPTER MASTERED! 🎉
              </h2>
              <p className="text-xl sm:text-2xl text-gray-800 font-medium mb-8">
                Amazing work! You've completed <br />
                <span className="text-green-600 font-bold">{currentChapter?.title}</span>!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                  <div className="text-3xl mb-2">🧙‍♂️</div>
                  <div className="text-lg font-bold text-blue-800">Spells Learned</div>
                  <div className="text-2xl font-bold text-blue-600">{currentChapter?.spells.length}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                  <div className="text-3xl mb-2">💎</div>
                  <div className="text-lg font-bold text-yellow-800">Gems Earned</div>
                  <div className="text-2xl font-bold text-yellow-600">+{50 + (currentChapter?.spells.reduce((sum, spell) => sum + spell.difficulty, 0) || 0)}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="text-lg font-bold text-purple-800">Achievement</div>
                  <div className="text-sm font-bold text-purple-600">Next Chapter Unlocked!</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={resetToMenu}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl rounded-xl"
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
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-4 text-lg font-bold text-white shadow-xl rounded-xl"
                >
                  🚀 Next Adventure
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
