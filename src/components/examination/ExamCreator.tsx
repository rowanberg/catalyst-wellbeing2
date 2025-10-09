'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
  Upload
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Examination</h1>
            <p className="text-slate-400">Design engaging assessments with AI assistance</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="bg-slate-800/50 border-slate-600 text-white">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Save className="w-4 h-4 mr-2" />
              Save Exam
            </Button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {step}
              </div>
              {step < 3 && <div className="w-12 h-0.5 bg-slate-700 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Exam Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                    <Input
                      value={examData.title}
                      onChange={(e) => setExamData({...examData, title: e.target.value})}
                      placeholder="Enter exam title"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                    <Input
                      value={examData.subject}
                      onChange={(e) => setExamData({...examData, subject: e.target.value})}
                      placeholder="e.g., Mathematics"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <Textarea
                    value={examData.description}
                    onChange={(e) => setExamData({...examData, description: e.target.value})}
                    placeholder="Brief description of the exam"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Grade Level</label>
                    <Select value={examData.grade_level} onValueChange={(value) => setExamData({...examData, grade_level: value})}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 12}, (_, i) => (
                          <SelectItem key={i+1} value={(i+1).toString()}>Grade {i+1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                    <Select value={examData.difficulty_level} onValueChange={(value) => setExamData({...examData, difficulty_level: value})}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={examData.duration_minutes}
                      onChange={(e) => setExamData({...examData, duration_minutes: parseInt(e.target.value)})}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)} className="bg-blue-500 hover:bg-blue-600">
                Next: Questions
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Questions */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* AI Generation */}
            <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  AI Question Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the topics you want questions about..."
                    className="bg-slate-700/50 border-slate-600 text-white flex-1"
                  />
                  <Button 
                    onClick={generateAIQuestions}
                    disabled={isGenerating || !aiPrompt}
                    className="bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">Question {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                      placeholder="Enter your question..."
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Select 
                        value={question.question_type} 
                        onValueChange={(value) => updateQuestion(index, 'question_type', value)}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        value={question.marks}
                        onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value))}
                        placeholder="Marks"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>

                    {question.question_type === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Options</label>
                        {question.options.map((option, optIndex) => (
                          <div key={option.id} className="flex items-center gap-2">
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
                              className="w-4 h-4 text-green-500"
                            />
                            <Input
                              value={option.option_text}
                              onChange={(e) => {
                                const updatedOptions = [...question.options!]
                                updatedOptions[optIndex].option_text = e.target.value
                                updateQuestion(index, 'options', updatedOptions)
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                              className="bg-slate-700/50 border-slate-600 text-white flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={addQuestion}
                variant="outline"
                className="w-full bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="bg-slate-800/50 border-slate-600 text-white">
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="bg-blue-500 hover:bg-blue-600">
                Next: Settings
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Settings */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Exam Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Security Options</h4>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300">Anti-cheat monitoring</label>
                      <Switch
                        checked={examData.anti_cheat_enabled}
                        onCheckedChange={(checked) => setExamData({...examData, anti_cheat_enabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-slate-300">Require webcam</label>
                      <Switch
                        checked={examData.require_webcam}
                        onCheckedChange={(checked) => setExamData({...examData, require_webcam: checked})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Exam Type</h4>
                    <Select value={examData.exam_type} onValueChange={(value) => setExamData({...examData, exam_type: value})}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final Exam</SelectItem>
                        <SelectItem value="practice">Practice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Instructions for Students</label>
                  <Textarea
                    value={examData.instructions}
                    onChange={(e) => setExamData({...examData, instructions: e.target.value})}
                    placeholder="Enter any special instructions..."
                    className="bg-slate-700/50 border-slate-600 text-white"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="bg-slate-800/50 border-slate-600 text-white">
                Back
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-green-500 to-emerald-600">
                <Save className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
