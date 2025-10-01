'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { 
  Target, 
  Plus, 
  Save, 
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Star,
  Award,
  BarChart3,
  Users,
  Calculator,
  Eye,
  Copy,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface RubricCriteria {
  id: string
  name: string
  description: string
  max_points: number
  levels: RubricLevel[]
}

interface RubricLevel {
  id: string
  name: string
  description: string
  points: number
}

interface Student {
  id: string
  first_name: string
  last_name: string
  grade_level: string
  class_name: string
}

interface Assessment {
  id: string
  title: string
  max_score: number
  rubric_criteria?: RubricCriteria[]
}

interface Grade {
  id: string
  student_id: string
  assessment_id: string
  score: number
  percentage: number
  letter_grade: string
  feedback?: string
  rubric_scores?: { [criteriaId: string]: number }
}

interface RubricGradingInterfaceProps {
  students: Student[]
  assessment: Assessment
  grades: { [studentId: string]: Grade }
  onGradeChange: (studentId: string, score: number, feedback?: string, rubricScores?: { [criteriaId: string]: number }) => void
}

export default function RubricGradingInterface({ 
  students, 
  assessment, 
  grades, 
  onGradeChange 
}: RubricGradingInterfaceProps) {
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriteria[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [currentScores, setCurrentScores] = useState<{ [criteriaId: string]: number }>({})
  const [feedback, setFeedback] = useState('')
  const [showRubricEditor, setShowRubricEditor] = useState(false)
  const [editingCriteria, setEditingCriteria] = useState<RubricCriteria | null>(null)

  // Initialize rubric criteria
  useEffect(() => {
    if (assessment.rubric_criteria && assessment.rubric_criteria.length > 0) {
      setRubricCriteria(assessment.rubric_criteria)
    } else {
      // Create default rubric
      setRubricCriteria(createDefaultRubric())
    }
  }, [assessment])

  // Load student's current scores when selected
  useEffect(() => {
    if (selectedStudent) {
      const grade = grades[selectedStudent.id]
      if (grade?.rubric_scores) {
        setCurrentScores(grade.rubric_scores)
        setFeedback(grade.feedback || '')
      } else {
        setCurrentScores({})
        setFeedback('')
      }
    }
  }, [selectedStudent, grades])

  const createDefaultRubric = (): RubricCriteria[] => {
    return [
      {
        id: 'content',
        name: 'Content Knowledge',
        description: 'Demonstrates understanding of key concepts and ideas',
        max_points: 25,
        levels: [
          { id: 'excellent', name: 'Excellent', description: 'Comprehensive understanding with detailed explanations', points: 25 },
          { id: 'proficient', name: 'Proficient', description: 'Good understanding with adequate explanations', points: 20 },
          { id: 'developing', name: 'Developing', description: 'Basic understanding with some gaps', points: 15 },
          { id: 'beginning', name: 'Beginning', description: 'Limited understanding with significant gaps', points: 10 }
        ]
      },
      {
        id: 'organization',
        name: 'Organization',
        description: 'Clear structure and logical flow of ideas',
        max_points: 20,
        levels: [
          { id: 'excellent', name: 'Excellent', description: 'Clear, logical organization throughout', points: 20 },
          { id: 'proficient', name: 'Proficient', description: 'Generally well organized', points: 16 },
          { id: 'developing', name: 'Developing', description: 'Some organizational issues', points: 12 },
          { id: 'beginning', name: 'Beginning', description: 'Lacks clear organization', points: 8 }
        ]
      },
      {
        id: 'communication',
        name: 'Communication',
        description: 'Clear and effective expression of ideas',
        max_points: 20,
        levels: [
          { id: 'excellent', name: 'Excellent', description: 'Clear, engaging, and error-free communication', points: 20 },
          { id: 'proficient', name: 'Proficient', description: 'Generally clear with minor errors', points: 16 },
          { id: 'developing', name: 'Developing', description: 'Somewhat clear with some errors', points: 12 },
          { id: 'beginning', name: 'Beginning', description: 'Unclear with frequent errors', points: 8 }
        ]
      },
      {
        id: 'effort',
        name: 'Effort & Completion',
        description: 'Thoroughness and attention to requirements',
        max_points: 15,
        levels: [
          { id: 'excellent', name: 'Excellent', description: 'Exceeds requirements with exceptional effort', points: 15 },
          { id: 'proficient', name: 'Proficient', description: 'Meets all requirements with good effort', points: 12 },
          { id: 'developing', name: 'Developing', description: 'Meets most requirements with adequate effort', points: 9 },
          { id: 'beginning', name: 'Beginning', description: 'Incomplete or minimal effort', points: 6 }
        ]
      }
    ]
  }

  const calculateTotalScore = () => {
    return Object.values(currentScores).reduce((sum, score) => sum + score, 0)
  }

  const saveGrade = () => {
    if (!selectedStudent) return

    const totalScore = calculateTotalScore()
    const maxPossible = rubricCriteria.reduce((sum, criteria) => sum + criteria.max_points, 0)
    const percentage = (totalScore / maxPossible) * 100

    onGradeChange(selectedStudent.id, totalScore, feedback, currentScores)
    toast.success(`Grade saved for ${selectedStudent.first_name} ${selectedStudent.last_name}`)
  }

  const addNewCriteria = () => {
    const newCriteria: RubricCriteria = {
      id: `criteria_${Date.now()}`,
      name: 'New Criteria',
      description: 'Description of the criteria',
      max_points: 10,
      levels: [
        { id: 'excellent', name: 'Excellent', description: 'Exceeds expectations', points: 10 },
        { id: 'proficient', name: 'Proficient', description: 'Meets expectations', points: 8 },
        { id: 'developing', name: 'Developing', description: 'Approaching expectations', points: 6 },
        { id: 'beginning', name: 'Beginning', description: 'Below expectations', points: 4 }
      ]
    }
    setRubricCriteria(prev => [...prev, newCriteria])
    setEditingCriteria(newCriteria)
  }

  const updateCriteria = (updatedCriteria: RubricCriteria) => {
    setRubricCriteria(prev => 
      prev.map(criteria => 
        criteria.id === updatedCriteria.id ? updatedCriteria : criteria
      )
    )
  }

  const deleteCriteria = (criteriaId: string) => {
    setRubricCriteria(prev => prev.filter(criteria => criteria.id !== criteriaId))
    // Remove scores for this criteria from current scores
    setCurrentScores(prev => {
      const updated = { ...prev }
      delete updated[criteriaId]
      return updated
    })
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Rubric-Based Grading
          </h2>
          <p className="text-gray-600 text-sm">Grade by criteria with detailed feedback</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowRubricEditor(!showRubricEditor)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Rubric
          </Button>
          
          <Button 
            onClick={addNewCriteria}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Criteria
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => {
                const grade = grades[student.id]
                const isSelected = selectedStudent?.id === student.id
                const hasGrade = !!grade
                
                return (
                  <motion.button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : hasGrade
                        ? 'border-green-200 bg-green-50 hover:border-green-300'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{student.class_name}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {hasGrade && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getGradeColor(grade.percentage)}`}
                          >
                            {Math.round(grade.percentage)}%
                          </Badge>
                        )}
                        {hasGrade && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Rubric Grading Interface */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    Grading: {selectedStudent.first_name} {selectedStudent.last_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      Total: {calculateTotalScore()}/{rubricCriteria.reduce((sum, c) => sum + c.max_points, 0)}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Rubric Criteria */}
                {rubricCriteria.map((criteria) => (
                  <div key={criteria.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{criteria.name}</h4>
                        <p className="text-sm text-gray-600">{criteria.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Max Points: {criteria.max_points}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">
                          {currentScores[criteria.id] || 0}/{criteria.max_points}
                        </div>
                      </div>
                    </div>

                    {/* Performance Levels */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {criteria.levels.map((level) => (
                        <motion.button
                          key={level.id}
                          onClick={() => setCurrentScores(prev => ({ ...prev, [criteria.id]: level.points }))}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            currentScores[criteria.id] === level.points
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="font-medium text-sm">{level.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{level.description}</div>
                          <div className="text-sm font-semibold text-purple-600 mt-2">
                            {level.points} pts
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Custom Score Slider */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Custom Score: {currentScores[criteria.id] || 0}
                      </label>
                      <Slider
                        value={[currentScores[criteria.id] || 0]}
                        onValueChange={(value: number[]) => setCurrentScores(prev => ({ ...prev, [criteria.id]: value[0] }))}
                        max={criteria.max_points}
                        step={0.5}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}

                {/* Overall Feedback */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Overall Feedback
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide detailed feedback on the student's performance..."
                    className="min-h-[100px]"
                  />
                </div>

                {/* Grade Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {calculateTotalScore()}
                      </div>
                      <div className="text-sm text-gray-600">Total Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((calculateTotalScore() / rubricCriteria.reduce((sum, c) => sum + c.max_points, 0)) * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Percentage</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {(() => {
                          const percentage = (calculateTotalScore() / rubricCriteria.reduce((sum, c) => sum + c.max_points, 0)) * 100
                          if (percentage >= 90) return 'A'
                          if (percentage >= 80) return 'B'
                          if (percentage >= 70) return 'C'
                          if (percentage >= 60) return 'D'
                          return 'F'
                        })()}
                      </div>
                      <div className="text-sm text-gray-600">Letter Grade</div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <Button onClick={saveGrade} className="w-full flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Grade & Feedback
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Select a Student to Grade
                </h3>
                <p className="text-gray-500 text-center">
                  Choose a student from the list to begin rubric-based grading
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Rubric Editor Modal */}
      <AnimatePresence>
        {showRubricEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRubricEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Edit Rubric</h3>
                <Button variant="ghost" onClick={() => setShowRubricEditor(false)}>×</Button>
              </div>

              <div className="space-y-4">
                {rubricCriteria.map((criteria, index) => (
                  <div key={criteria.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Criteria {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCriteria(criteria)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCriteria(criteria.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input value={criteria.name} readOnly />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Max Points</label>
                        <Input value={criteria.max_points} readOnly />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Levels</label>
                        <Input value={criteria.levels.length} readOnly />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowRubricEditor(false)}>
                  Close
                </Button>
                <Button onClick={addNewCriteria}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Criteria
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
