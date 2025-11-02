'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Save, 
  Wand2, 
  BookOpen, 
  Clock, 
  Target,
  Settings,
  Eye,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Sparkles,
  Copy,
  FileText,
  List,
  AlertCircle,
  Star,
  Brain
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  marks: number
  options?: Array<{ id: string; option_text: string; is_correct: boolean }>
  correct_answer?: string
}

interface ExamCreatorProps {
  onSave: (examData: any) => void
  onCancel: () => void
  initialData?: any
}

export function ExamCreator({ onSave, onCancel, initialData }: ExamCreatorProps) {
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    subject: '',
    grade_level: '',
    difficulty_level: 'medium',
    duration_minutes: 60,
    exam_type: 'quiz',
    instructions: '',
    require_webcam: false,
    anti_cheat_enabled: true,
    ...initialData
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      question_type: 'multiple_choice',
      marks: 1,
      options: [
        { id: '1', option_text: '', is_correct: false },
        { id: '2', option_text: '', is_correct: false },
        { id: '3', option_text: '', is_correct: false },
        { id: '4', option_text: '', is_correct: false }
      ]
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const generateAIQuestions = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/examination/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          subject: examData.subject,
          grade_level: examData.grade_level,
          difficulty: examData.difficulty_level,
          count: 5
        })
      })
      
      const data = await response.json()
      if (data.questions) {
        setQuestions([...questions, ...data.questions])
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    // Validate required fields
    if (!examData.title || !examData.subject || !examData.grade_level) {
      alert('Please fill in all required fields (Title, Subject, Grade Level)')
      return
    }

    // Validate questions requirement
    if (questions.length === 0) {
      alert('Please add at least one question to the exam')
      return
    }

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
    
    // Ensure total_marks is at least 1
    const finalTotalMarks = Math.max(totalMarks, 1)
    
    const examPayload = {
      ...examData,
      questions,
      total_questions: questions.length,
      total_marks: finalTotalMarks,
      passing_marks: Math.floor(finalTotalMarks * 0.6) // 60% passing grade
    }
    
    console.log('ExamCreator sending data:', examPayload)
    onSave(examPayload)
  }

  const steps = [
    { id: 1, name: 'Basic Info', icon: BookOpen, description: 'Exam details' },
    { id: 2, name: 'Questions', icon: List, description: 'Add questions' },
    { id: 3, name: 'Settings', icon: Settings, description: 'Configure exam' }
  ]

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Create Examination
                </h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">Design engaging assessments with AI assistance</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onCancel} 
                className="bg-white/50 backdrop-blur-sm hover:bg-white/80 border-gray-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Exam
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Step Indicator */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className={`flex items-center gap-3 cursor-pointer ${
                      isActive ? 'opacity-100' : isCompleted ? 'opacity-100' : 'opacity-50'
                    }`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg scale-110' 
                        : isCompleted
                          ? 'bg-green-500 shadow-md'
                          : 'bg-gray-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <StepIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`font-semibold ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </motion.div>
                  
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4 hidden sm:block">
                      <div className={`h-1 rounded-full transition-all duration-300 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-gray-900 flex items-center gap-2 text-xl">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    Exam Details
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">Provide basic information about your examination</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Exam Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={examData.title}
                        onChange={(e) => setExamData({...examData, title: e.target.value})}
                        placeholder="e.g., Mid-term Mathematics Exam"
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-11"
                      />
                      {!examData.title && <p className="text-xs text-gray-500">This field is required</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={examData.subject}
                        onChange={(e) => setExamData({...examData, subject: e.target.value})}
                        placeholder="e.g., Mathematics, Physics, English"
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Description</label>
                    <Textarea
                      value={examData.description}
                      onChange={(e) => setExamData({...examData, description: e.target.value})}
                      placeholder="Provide a brief description of what this exam covers..."
                      className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                      rows={4}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Grade Level <span className="text-red-500">*</span>
                      </label>
                      <Select value={examData.grade_level} onValueChange={(value) => setExamData({...examData, grade_level: value})}>
                        <SelectTrigger className="bg-white border-gray-300 h-11">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 12}, (_, i) => (
                            <SelectItem key={i+1} value={(i+1).toString()}>Grade {i+1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Difficulty Level</label>
                      <Select value={examData.difficulty_level} onValueChange={(value) => setExamData({...examData, difficulty_level: value})}>
                        <SelectTrigger className="bg-white border-gray-300 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">🟢 Easy</SelectItem>
                          <SelectItem value="medium">🟡 Medium</SelectItem>
                          <SelectItem value="hard">🟠 Hard</SelectItem>
                          <SelectItem value="expert">🔴 Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={examData.duration_minutes}
                        onChange={(e) => setExamData({...examData, duration_minutes: parseInt(e.target.value)})}
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-11"
                        min={1}
                        max={300}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
                  <Clock className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{examData.duration_minutes || 0}</p>
                  <p className="text-xs opacity-90">Minutes</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
                  <Target className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{questions.length}</p>
                  <p className="text-xs opacity-90">Questions</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
                  <Star className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{totalMarks}</p>
                  <p className="text-xs opacity-90">Total Marks</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
                  <Brain className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{examData.difficulty_level}</p>
                  <p className="text-xs opacity-90">Difficulty</p>
                </motion.div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="bg-white border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={() => setCurrentStep(2)} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={!examData.title || !examData.subject || !examData.grade_level}
                >
                  Next: Questions
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* AI Generation */}
              <Card className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-gray-900 flex items-center gap-2 text-xl">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    AI Question Generator
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">Let AI help you create engaging questions instantly</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., Create questions about Pythagorean theorem for Grade 10..."
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500 flex-1 min-h-[80px]"
                    />
                    <Button 
                      onClick={generateAIQuestions}
                      disabled={isGenerating || !aiPrompt}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg h-auto px-6"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Questions List */}
              <div className="space-y-4">
                <AnimatePresence>
                  {questions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                {index + 1}
                              </div>
                              <CardTitle className="text-gray-900 text-lg">Question {index + 1}</CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <Textarea
                            value={question.question_text}
                            onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                            placeholder="Enter your question here..."
                            className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">Question Type</label>
                              <Select 
                                value={question.question_type} 
                                onValueChange={(value) => updateQuestion(index, 'question_type', value)}
                              >
                                <SelectTrigger className="bg-white border-gray-300 h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple_choice">📝 Multiple Choice</SelectItem>
                                  <SelectItem value="true_false">✅ True/False</SelectItem>
                                  <SelectItem value="short_answer">📄 Short Answer</SelectItem>
                                  <SelectItem value="essay">📚 Essay</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">Marks</label>
                              <Input
                                type="number"
                                value={question.marks}
                                onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value))}
                                placeholder="Points"
                                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-11"
                                min={1}
                              />
                            </div>
                          </div>

                          {question.question_type === 'multiple_choice' && question.options && (
                            <div className="space-y-3">
                              <label className="text-sm font-semibold text-gray-700">Options (select the correct answer)</label>
                              {question.options.map((option, optIndex) => (
                                <div key={option.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                                  <input
                                    type="radio"
                                    name={`correct-${question.id}`}
                                    checked={option.is_correct}
                                    onChange={() => {
                                      const updatedOptions = question.options!.map((opt, i) => ({
                                        ...opt,
                                        is_correct: i === optIndex
                                      }))
                                      updateQuestion(index, 'options', updatedOptions)
                                    }}
                                    className="w-5 h-5 text-green-500 focus:ring-2 focus:ring-green-500"
                                  />
                                  <Input
                                    value={option.option_text}
                                    onChange={(e) => {
                                      const updatedOptions = [...question.options!]
                                      updatedOptions[optIndex].option_text = e.target.value
                                      updateQuestion(index, 'options', updatedOptions)
                                    }}
                                    placeholder={`Option ${optIndex + 1}`}
                                    className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 flex-1 ${
                                      option.is_correct ? 'border-green-400 bg-green-50' : ''
                                    }`}
                                  />
                                  {option.is_correct && (
                                    <Badge className="bg-green-500 text-white">Correct</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button
                  onClick={addQuestion}
                  variant="outline"
                  className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 h-16 text-base font-medium"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Question
                </Button>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)} 
                  className="bg-white border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={questions.length === 0}
                >
                  Next: Settings
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-gray-900 flex items-center gap-2 text-xl">
                    <Settings className="w-6 h-6 text-blue-600" />
                    Exam Settings
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">Configure security and exam preferences</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <h4 className="text-gray-900 font-semibold flex items-center gap-2">
                        <Eye className="w-5 h-5 text-blue-600" />
                        Security Options
                      </h4>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <label className="text-gray-700 font-medium block">Anti-cheat monitoring</label>
                          <p className="text-xs text-gray-500">Track suspicious behavior</p>
                        </div>
                        <Switch
                          checked={examData.anti_cheat_enabled}
                          onCheckedChange={(checked) => setExamData({...examData, anti_cheat_enabled: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <label className="text-gray-700 font-medium block">Require webcam</label>
                          <p className="text-xs text-gray-500">Verify student identity</p>
                        </div>
                        <Switch
                          checked={examData.require_webcam}
                          onCheckedChange={(checked) => setExamData({...examData, require_webcam: checked})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <h4 className="text-gray-900 font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        Exam Type
                      </h4>
                      <Select value={examData.exam_type} onValueChange={(value) => setExamData({...examData, exam_type: value})}>
                        <SelectTrigger className="bg-white border-gray-300 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quiz">📝 Quiz</SelectItem>
                          <SelectItem value="test">📄 Test</SelectItem>
                          <SelectItem value="midterm">📚 Midterm</SelectItem>
                          <SelectItem value="final">🎓 Final Exam</SelectItem>
                          <SelectItem value="practice">🔄 Practice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Instructions for Students</label>
                    <Textarea
                      value={examData.instructions}
                      onChange={(e) => setExamData({...examData, instructions: e.target.value})}
                      placeholder="Enter any special instructions, rules, or guidelines for students..."
                      className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    Exam Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-gray-600">Total Questions</p>
                      <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-gray-600">Total Marks</p>
                      <p className="text-2xl font-bold text-gray-900">{totalMarks}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-gray-600">Duration</p>
                      <p className="text-2xl font-bold text-gray-900">{examData.duration_minutes}min</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-gray-600">Passing</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.floor(totalMarks * 0.6)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(2)} 
                  className="bg-white border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg px-8"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Exam
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
