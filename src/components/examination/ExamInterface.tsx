'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Pause,
  Play,
  Send,
  Camera,
  Mic,
  MicOff,
  Maximize,
  Minimize,
  Shield,
  Brain,
  Sparkles,
  Timer,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank'
  marks: number
  options?: Array<{
    id: string
    option_text: string
  }>
  image_url?: string
  time_limit_seconds?: number
}

interface ExamInterfaceProps {
  exam: {
    id: string
    title: string
    description?: string
    duration_minutes: number
    total_questions: number
    total_marks: number
    instructions?: string
    require_webcam: boolean
    anti_cheat_enabled: boolean
  }
  questions: Question[]
  sessionId: string
  onSubmit: (answers: Record<string, any>) => void
  onSaveProgress: (answers: Record<string, any>) => void
  onSecurityEvent: (event: any) => void
}

export function ExamInterface({ 
  exam, 
  questions, 
  sessionId, 
  onSubmit, 
  onSaveProgress, 
  onSecurityEvent 
}: ExamInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(exam.duration_minutes * 60)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [webcamActive, setWebcamActive] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [examStarted, setExamStarted] = useState(false)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [showBreathingExercise, setShowBreathingExercise] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const examContainerRef = useRef<HTMLDivElement>(null)

  const currentQuestion = questions[currentQuestionIndex]

  // Timer effect
  useEffect(() => {
    if (!examStarted) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [examStarted])

  // Security monitoring
  useEffect(() => {
    if (!exam.anti_cheat_enabled || !examStarted) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1)
        onSecurityEvent({
          type: 'tab_switch',
          timestamp: Date.now(),
          data: { total_switches: tabSwitches + 1 }
        })
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      onSecurityEvent({
        type: 'right_click',
        timestamp: Date.now()
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common cheating shortcuts
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'f')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault()
        onSecurityEvent({
          type: 'keyboard_shortcut',
          timestamp: Date.now(),
          data: { key: e.key, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [examStarted, tabSwitches])

  // Webcam setup
  useEffect(() => {
    if (exam.require_webcam && examStarted) {
      setupWebcam()
    }
  }, [examStarted])

  const setupWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setWebcamActive(true)
      }
    } catch (error) {
      console.error('Webcam access denied:', error)
      onSecurityEvent({
        type: 'webcam_denied',
        timestamp: Date.now()
      })
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    const percentage = (timeRemaining / (exam.duration_minutes * 60)) * 100
    if (percentage <= 10) return 'text-red-400'
    if (percentage <= 25) return 'text-yellow-400'
    return 'text-green-400'
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    const newAnswers = { ...answers, [questionId]: answer }
    setAnswers(newAnswers)
    
    // Auto-save progress every 30 seconds
    const now = Date.now()
    const lastSave = localStorage.getItem(`exam_${sessionId}_last_save`)
    if (!lastSave || now - parseInt(lastSave) > 30000) {
      onSaveProgress(newAnswers)
      localStorage.setItem(`exam_${sessionId}_last_save`, now.toString())
    }
  }

  const toggleFlag = (questionId: string) => {
    const newFlagged = new Set(flaggedQuestions)
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId)
    } else {
      newFlagged.add(questionId)
    }
    setFlaggedQuestions(newFlagged)
  }

  const handleAutoSubmit = () => {
    onSubmit(answers)
  }

  const handleManualSubmit = () => {
    if (confirm('Are you sure you want to submit your exam? This action cannot be undone.')) {
      onSubmit(answers)
    }
  }

  const startExam = () => {
    setShowInstructions(false)
    setShowBreathingExercise(true)
    
    // Start breathing exercise
    setTimeout(() => {
      setShowBreathingExercise(false)
      setExamStarted(true)
      
      // Request fullscreen if anti-cheat is enabled
      if (exam.anti_cheat_enabled && examContainerRef.current) {
        examContainerRef.current.requestFullscreen?.()
        setIsFullscreen(true)
      }
    }, 10000) // 10 second breathing exercise
  }

  const getProgressPercentage = () => {
    const answeredQuestions = Object.keys(answers).length
    return (answeredQuestions / questions.length) * 100
  }

  // Breathing exercise component
  if (showBreathingExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center"
          >
            <Brain className="w-16 h-16" />
          </motion.div>
          
          <h2 className="text-3xl font-bold mb-4">Prepare Your Mind</h2>
          <p className="text-xl text-blue-200 mb-8">Take deep breaths and focus</p>
          
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg"
          >
            Breathe in... Hold... Breathe out...
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Instructions screen
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8"
          >
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center"
              >
                <Target className="w-10 h-10 text-white" />
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white mb-2">{exam.title}</h1>
              <p className="text-slate-400">{exam.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Exam Details
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{exam.duration_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span className="font-medium">{exam.total_questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Marks:</span>
                    <span className="font-medium">{exam.total_marks}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Security Features
                </h3>
                <div className="space-y-2 text-slate-300">
                  {exam.anti_cheat_enabled && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>Anti-cheat monitoring</span>
                    </div>
                  )}
                  {exam.require_webcam && (
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-400" />
                      <span>Webcam required</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-purple-400" />
                    <span>Fullscreen mode</span>
                  </div>
                </div>
              </div>
            </div>

            {exam.instructions && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Instructions</h3>
                <div className="bg-slate-800/50 rounded-lg p-4 text-slate-300">
                  {exam.instructions}
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={startExam}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Examination
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Main exam interface
  return (
    <div 
      ref={examContainerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative"
    >
      {/* Webcam overlay */}
      {exam.require_webcam && webcamActive && (
        <div className="fixed top-4 right-4 z-50">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-32 h-24 rounded-lg border-2 border-blue-500/50 bg-black"
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">{exam.title}</h1>
            {tabSwitches > 0 && (
              <Badge variant="destructive" className="bg-red-500/20 text-red-300">
                ⚠️ {tabSwitches} violations
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${getTimeColor()} font-mono text-lg`}>
              <Timer className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
            
            <Button
              onClick={handleManualSubmit}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Progress: {Object.keys(answers).length}/{questions.length} answered</span>
            <span>{Math.round(getProgressPercentage())}% complete</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Question navigation sidebar */}
        <div className="w-64 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 p-4 overflow-y-auto">
          <h3 className="text-white font-semibold mb-4">Questions</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((question, index) => (
              <motion.button
                key={question.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`
                  relative w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium
                  ${index === currentQuestionIndex 
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300' 
                    : answers[question.id] 
                      ? 'border-green-500 bg-green-500/20 text-green-300'
                      : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
                  }
                `}
              >
                {index + 1}
                {flaggedQuestions.has(question.id) && (
                  <Flag className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main question area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-2">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <Badge variant="outline" className="bg-slate-700/50">
                          {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-700/50">
                          {currentQuestion.question_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={flaggedQuestions.has(currentQuestion.id) ? 'text-yellow-400' : 'text-slate-400'}
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Question text */}
                  <div className="text-white text-lg leading-relaxed">
                    {currentQuestion.question_text}
                  </div>

                  {/* Question image */}
                  {currentQuestion.image_url && (
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src={currentQuestion.image_url} 
                        alt="Question image"
                        className="w-full max-w-md mx-auto"
                      />
                    </div>
                  )}

                  {/* Answer options */}
                  <div className="space-y-3">
                    {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                          <motion.label
                            key={option.id}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 cursor-pointer transition-colors"
                          >
                            <input
                              type="radio"
                              name={currentQuestion.id}
                              value={option.id}
                              checked={answers[currentQuestion.id] === option.id}
                              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                              className="w-4 h-4 text-blue-500"
                            />
                            <span className="text-white flex-1">{option.option_text}</span>
                          </motion.label>
                        ))}
                      </div>
                    )}

                    {currentQuestion.question_type === 'true_false' && (
                      <div className="flex gap-4">
                        {['true', 'false'].map((value) => (
                          <motion.label
                            key={value}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 cursor-pointer transition-colors flex-1"
                          >
                            <input
                              type="radio"
                              name={currentQuestion.id}
                              value={value}
                              checked={answers[currentQuestion.id] === value}
                              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                              className="w-4 h-4 text-blue-500"
                            />
                            <span className="text-white capitalize">{value}</span>
                          </motion.label>
                        ))}
                      </div>
                    )}

                    {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
                      <Textarea
                        placeholder="Type your answer here..."
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="bg-slate-700/30 border-slate-600/50 text-white placeholder-slate-400 min-h-[120px]"
                        rows={currentQuestion.question_type === 'essay' ? 8 : 4}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
