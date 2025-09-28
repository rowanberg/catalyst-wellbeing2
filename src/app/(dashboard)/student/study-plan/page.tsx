'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Brain, 
  Clock, 
  Target, 
  Calendar, 
  BookOpen, 
  TrendingUp,
  Zap,
  Star,
  CheckCircle,
  Plus,
  X,
  Save,
  Sparkles,
  BarChart3,
  Award,
  Timer,
  Users,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit3,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Flame,
  Trophy,
  Rocket,
  GraduationCap
} from 'lucide-react'

interface Subject {
  id: string
  name: string
  currentGrade: number
  targetGrade: number
  difficulty: 'easy' | 'medium' | 'hard'
  priority: 'low' | 'medium' | 'high'
  weeklyHours: number
}

interface StudySession {
  id: string
  subject: string
  topic: string
  duration: number
  type: 'review' | 'practice' | 'new-material' | 'test-prep'
  difficulty: 'easy' | 'medium' | 'hard'
}

interface StudyPlan {
  id: string
  name: string
  goal: string
  subjects: Subject[]
  totalWeeklyHours: number
  studyDays: string[]
  sessions: StudySession[]
  createdAt: string
  targetDate: string
}

// Enhanced Mobile-First Card Component
const MobileCard = ({ children, className = "", delay = 0, gradient = false }: { 
  children: React.ReactNode
  className?: string
  delay?: number 
  gradient?: boolean
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ 
      duration: 0.5, 
      delay,
      type: "spring",
      stiffness: 100,
      damping: 15
    }}
    whileHover={{ 
      y: -2,
      transition: { duration: 0.2 }
    }}
    className={`${className} ${gradient ? 'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30' : 'bg-white/95'} backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300`}
  >
    {children}
  </motion.div>
)

// Mobile Step Indicator Component
const MobileStepIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => (
  <div className="flex items-center justify-center space-x-2 mb-6">
    {Array.from({ length: totalSteps }, (_, i) => (
      <motion.div
        key={i}
        className={`h-2 rounded-full transition-all duration-300 ${
          i + 1 <= currentStep 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8' 
            : 'bg-gray-200 w-2'
        }`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: i * 0.1 }}
      />
    ))}
  </div>
)

// Mobile Navigation Component
const MobileNavigation = ({ 
  currentStep, 
  onBack, 
  onNext, 
  canProceed = true, 
  nextLabel = "Continue",
  isLoading = false 
}: {
  currentStep: number
  onBack?: () => void
  onNext?: () => void
  canProceed?: boolean
  nextLabel?: string
  isLoading?: boolean
}) => (
  <div className="flex gap-3 mt-6">
    {onBack && (
      <Button 
        onClick={onBack}
        variant="outline" 
        className="flex-1 h-12 text-base font-semibold border-2 border-gray-200 hover:border-gray-300 rounded-xl"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
    )}
    {onNext && (
      <Button 
        onClick={onNext}
        disabled={!canProceed || isLoading}
        className={`flex-1 h-12 text-base font-semibold rounded-xl transition-all duration-300 ${
          canProceed 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl' 
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 mr-2"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.div>
        ) : (
          <>
            {nextLabel}
            <ChevronRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    )}
  </div>
)

export default function StudyPlanPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [studyPlan, setStudyPlan] = useState<Partial<StudyPlan>>({
    name: '',
    goal: '',
    subjects: [],
    studyDays: [],
    totalWeeklyHours: 0,
    sessions: []
  })

  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    name: '',
    currentGrade: 0,
    targetGrade: 0,
    difficulty: 'medium',
    priority: 'medium',
    weeklyHours: 0
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSessions, setGeneratedSessions] = useState<StudySession[]>([])

  const steps = [
    { id: 1, title: 'Plan Details', icon: Target },
    { id: 2, title: 'Add Subjects', icon: BookOpen },
    { id: 3, title: 'Schedule', icon: Calendar },
    { id: 4, title: 'AI Generation', icon: Brain },
    { id: 5, title: 'Review & Save', icon: Save }
  ]

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const addSubject = () => {
    if (newSubject.name && newSubject.currentGrade && newSubject.targetGrade) {
      const subject: Subject = {
        id: Date.now().toString(),
        name: newSubject.name,
        currentGrade: newSubject.currentGrade,
        targetGrade: newSubject.targetGrade,
        difficulty: newSubject.difficulty || 'medium',
        priority: newSubject.priority || 'medium',
        weeklyHours: newSubject.weeklyHours || 2
      }
      
      setStudyPlan(prev => ({
        ...prev,
        subjects: [...(prev.subjects || []), subject]
      }))
      
      setNewSubject({
        name: '',
        currentGrade: 0,
        targetGrade: 0,
        difficulty: 'medium',
        priority: 'medium',
        weeklyHours: 0
      })
    }
  }

  const removeSubject = (id: string) => {
    setStudyPlan(prev => ({
      ...prev,
      subjects: prev.subjects?.filter(s => s.id !== id) || []
    }))
  }

  const generateAIStudyPlan = async () => {
    setIsGenerating(true)
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const sessions: StudySession[] = []
    
    studyPlan.subjects?.forEach(subject => {
      const sessionsPerWeek = Math.ceil(subject.weeklyHours / 1.5)
      
      for (let i = 0; i < sessionsPerWeek; i++) {
        sessions.push({
          id: `${subject.id}-${i}`,
          subject: subject.name,
          topic: `${subject.name} - Session ${i + 1}`,
          duration: 90,
          type: i % 3 === 0 ? 'new-material' : i % 3 === 1 ? 'practice' : 'review',
          difficulty: subject.difficulty
        })
      }
    })
    
    setGeneratedSessions(sessions)
    setStudyPlan(prev => ({ ...prev, sessions }))
    setIsGenerating(false)
  }

  const savePlan = async () => {
    const finalPlan: StudyPlan = {
      id: Date.now().toString(),
      name: studyPlan.name || 'My Study Plan',
      goal: studyPlan.goal || '',
      subjects: studyPlan.subjects || [],
      totalWeeklyHours: studyPlan.subjects?.reduce((total, s) => total + s.weeklyHours, 0) || 0,
      studyDays: studyPlan.studyDays || [],
      sessions: studyPlan.sessions || [],
      createdAt: new Date().toISOString(),
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    // Save to localStorage for now
    const existingPlans = JSON.parse(localStorage.getItem('studyPlans') || '[]')
    existingPlans.push(finalPlan)
    localStorage.setItem('studyPlans', JSON.stringify(existingPlans))
    
    router.push('/student/study-plan/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-24 h-24 bg-pink-300/20 rounded-full blur-xl"
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Modern Mobile Header */}
      <motion.div 
        className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-purple-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Create Study Plan</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Build your personalized learning journey</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Brain className="h-6 w-6 text-purple-600" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="h-5 w-5 text-pink-500" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile-Optimized Content */}
      <div className="px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        {/* Mobile Step Indicator */}
        <MobileStepIndicator currentStep={currentStep} totalSteps={5} />

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Plan Details - Mobile Enhanced */}
          {currentStep === 1 && (
            <MobileCard className="p-6 sm:p-8" gradient>
              <div className="text-center mb-6">
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Target className="h-8 w-8 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Let's Start Planning!</h2>
                <p className="text-sm sm:text-base text-gray-600">Tell us about your study goals</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="planName" className="text-base font-semibold text-gray-700 mb-2 block">
                    📚 Study Plan Name
                  </Label>
                  <Input
                    id="planName"
                    placeholder="e.g., Final Exam Preparation, Math Mastery"
                    value={studyPlan.name}
                    onChange={(e) => setStudyPlan(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 text-base border-2 border-gray-200 focus:border-purple-400 rounded-xl transition-colors"
                  />
                </div>
                
                <div>
                  <Label htmlFor="goal" className="text-base font-semibold text-gray-700 mb-2 block">
                    🎯 Learning Goal
                  </Label>
                  <Textarea
                    id="goal"
                    placeholder="What do you want to achieve? Be specific about your goals..."
                    value={studyPlan.goal}
                    onChange={(e) => setStudyPlan(prev => ({ ...prev, goal: e.target.value }))}
                    className="min-h-[100px] text-base border-2 border-gray-200 focus:border-purple-400 rounded-xl transition-colors resize-none"
                    rows={4}
                  />
                </div>

                {/* Motivational Tips */}
                <motion.div 
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-800 text-sm">💡 Pro Tip</h4>
                      <p className="text-blue-700 text-xs sm:text-sm mt-1">
                        Make your goals specific and measurable. Instead of "improve math", try "increase algebra test scores from 75% to 90%"
                      </p>
                    </div>
                  </div>
                </motion.div>

                <MobileNavigation
                  currentStep={currentStep}
                  onNext={() => setCurrentStep(2)}
                  canProceed={!!studyPlan.name?.trim()}
                  nextLabel="Start Adding Subjects"
                />
              </div>
            </MobileCard>
          )}

          {/* Step 2: Add Subjects */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <MobileCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Add Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Subject Name</Label>
                      <Input
                        placeholder="e.g., Mathematics"
                        value={newSubject.name}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Current Grade (%)</Label>
                      <Input
                        type="number"
                        placeholder="75"
                        value={newSubject.currentGrade}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, currentGrade: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label>Target Grade (%)</Label>
                      <Input
                        type="number"
                        placeholder="90"
                        value={newSubject.targetGrade}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, targetGrade: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Difficulty Level</Label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={newSubject.difficulty}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={newSubject.priority}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <Label>Weekly Hours</Label>
                      <Input
                        type="number"
                        placeholder="4"
                        value={newSubject.weeklyHours}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, weeklyHours: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={addSubject} className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </CardContent>
              </MobileCard>

              {/* Added Subjects */}
              {studyPlan.subjects && studyPlan.subjects.length > 0 && (
                <MobileCard>
                  <CardHeader>
                    <CardTitle>Added Subjects ({studyPlan.subjects.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studyPlan.subjects.map((subject) => (
                        <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{subject.name}</h4>
                              <Badge variant={subject.priority === 'high' ? 'destructive' : subject.priority === 'medium' ? 'default' : 'secondary'}>
                                {subject.priority} priority
                              </Badge>
                              <Badge variant="outline">{subject.difficulty}</Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              Current: {subject.currentGrade}% → Target: {subject.targetGrade}% | {subject.weeklyHours}h/week
                            </div>
                          </div>
                          <Button
                            onClick={() => removeSubject(subject.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button onClick={() => setCurrentStep(1)} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        disabled={!studyPlan.subjects || studyPlan.subjects.length === 0}
                      >
                        Continue to Schedule
                      </Button>
                    </div>
                  </CardContent>
                </MobileCard>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <MobileCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Study Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Select Study Days</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {weekDays.map((day) => (
                      <Button
                        key={day}
                        variant={studyPlan.studyDays?.includes(day) ? "default" : "outline"}
                        onClick={() => {
                          const days = studyPlan.studyDays || []
                          if (days.includes(day)) {
                            setStudyPlan(prev => ({
                              ...prev,
                              studyDays: days.filter(d => d !== day)
                            }))
                          } else {
                            setStudyPlan(prev => ({
                              ...prev,
                              studyDays: [...days, day]
                            }))
                          }
                        }}
                        className="text-sm"
                      >
                        {day.substring(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📊 Study Plan Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Total Subjects:</span>
                      <span className="font-semibold ml-2">{studyPlan.subjects?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Weekly Hours:</span>
                      <span className="font-semibold ml-2">
                        {studyPlan.subjects?.reduce((total, s) => total + s.weeklyHours, 0) || 0}h
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Study Days:</span>
                      <span className="font-semibold ml-2">{studyPlan.studyDays?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Daily Average:</span>
                      <span className="font-semibold ml-2">
                        {studyPlan.studyDays?.length ? 
                          Math.round(((studyPlan.subjects?.reduce((total, s) => total + s.weeklyHours, 0) || 0) / studyPlan.studyDays.length) * 10) / 10 
                          : 0}h
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setCurrentStep(2)} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={!studyPlan.studyDays || studyPlan.studyDays.length === 0}
                  >
                    Generate AI Plan
                  </Button>
                </div>
              </CardContent>
            </MobileCard>
          )}

          {/* Step 4: AI Generation */}
          {currentStep === 4 && (
            <MobileCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Study Plan Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isGenerating && generatedSessions.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Generate Your Plan!</h3>
                    <p className="text-gray-600 mb-6">
                      Our AI will create personalized study sessions based on your subjects, goals, and schedule.
                    </p>
                    <Button
                      onClick={generateAIStudyPlan}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate My Study Plan
                    </Button>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center py-8">
                    <div className="animate-spin text-6xl mb-4">🧠</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Generating Your Plan...</h3>
                    <p className="text-gray-600 mb-4">AI is analyzing your subjects and creating optimal study sessions</p>
                    <Progress value={66} className="w-full max-w-md mx-auto" />
                  </div>
                )}

                {generatedSessions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      🎯 Generated Study Sessions ({generatedSessions.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {generatedSessions.map((session) => (
                        <div key={session.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-800">{session.topic}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={session.type === 'new-material' ? 'default' : session.type === 'practice' ? 'secondary' : 'outline'}>
                                {session.type.replace('-', ' ')}
                              </Badge>
                              <Badge variant="outline">{session.difficulty}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Timer className="h-4 w-4" />
                              {session.duration} min
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {session.subject}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <Button onClick={() => setCurrentStep(3)} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(5)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        Review & Save
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </MobileCard>
          )}

          {/* Step 5: Review & Save */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <MobileCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Save className="h-5 w-5 text-green-600" />
                    Review Your Study Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{studyPlan.name}</h3>
                    <p className="text-gray-600 mb-4">{studyPlan.goal}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{studyPlan.subjects?.length}</div>
                        <div className="text-sm text-gray-600">Subjects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {studyPlan.subjects?.reduce((total, s) => total + s.weeklyHours, 0)}h
                        </div>
                        <div className="text-sm text-gray-600">Per Week</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-600">{studyPlan.studyDays?.length}</div>
                        <div className="text-sm text-gray-600">Study Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{generatedSessions.length}</div>
                        <div className="text-sm text-gray-600">Sessions</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">📚 Subjects</h4>
                      <div className="space-y-2">
                        {studyPlan.subjects?.map((subject) => (
                          <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-sm text-gray-600">{subject.weeklyHours}h/week</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">📅 Study Days</h4>
                      <div className="flex flex-wrap gap-2">
                        {studyPlan.studyDays?.map((day) => (
                          <Badge key={day} variant="outline" className="px-3 py-1">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => setCurrentStep(4)} variant="outline" className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={savePlan}
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save My Study Plan
                    </Button>
                  </div>
                </CardContent>
              </MobileCard>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
