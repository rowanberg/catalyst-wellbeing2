'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  Save, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Star,
  Loader2,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: string
  first_name: string
  last_name: string
  full_name?: string
  student_number?: string
  student_id?: string
  grade_level?: string
  class_name?: string
}

interface Assessment {
  id: string
  title: string
  type: 'quiz' | 'test' | 'assignment' | 'project' | 'exam'
  max_score: number
  created_at: string
  class_id: string
  due_date?: string
  rubric?: any[]
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
  created_at: string
  updated_at: string
}

interface StudentGradeListProps {
  students: Student[]
  assessment: Assessment | null
  grades: { [studentId: string]: Grade }
  onGradeChange: (studentId: string, grade: Grade) => void
  onSaveGrades: () => Promise<void>
  loading?: boolean
  mode?: 'grid' | 'list' | 'compact'
  showFeedback?: boolean
  showAnalytics?: boolean
}

export default function StudentGradeList({
  students,
  assessment,
  grades,
  onGradeChange,
  onSaveGrades,
  loading = false,
  mode = 'list',
  showFeedback = false,
  showAnalytics = false
}: StudentGradeListProps) {
  const [localGrades, setLocalGrades] = useState<{ [studentId: string]: Partial<Grade> }>({})
  const [savingGrades, setSavingGrades] = useState(false)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  const calculateLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const handleScoreChange = (studentId: string, score: number) => {
    if (!assessment) return
    
    const percentage = (score / assessment.max_score) * 100
    const letterGrade = calculateLetterGrade(percentage)
    
    const updatedGrade: Grade = {
      id: grades[studentId]?.id || `temp_${Date.now()}_${studentId}`,
      student_id: studentId,
      assessment_id: assessment.id,
      score,
      percentage,
      letter_grade: letterGrade,
      feedback: grades[studentId]?.feedback || localGrades[studentId]?.feedback || '',
      created_at: grades[studentId]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setLocalGrades(prev => ({ ...prev, [studentId]: updatedGrade }))
    onGradeChange(studentId, updatedGrade)
  }

  const handleFeedbackChange = (studentId: string, feedback: string) => {
    const currentGrade = grades[studentId] || localGrades[studentId]
    const updatedGrade: Grade = {
      id: currentGrade?.id || `temp_${Date.now()}_${studentId}`,
      student_id: studentId,
      assessment_id: assessment?.id || '',
      score: currentGrade?.score || 0,
      percentage: currentGrade?.percentage || 0,
      letter_grade: currentGrade?.letter_grade || 'F',
      feedback,
      created_at: currentGrade?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setLocalGrades(prev => ({ ...prev, [studentId]: updatedGrade }))
    if (currentGrade?.score !== undefined) {
      onGradeChange(studentId, updatedGrade)
    }
  }

  const handleSaveAll = async () => {
    setSavingGrades(true)
    try {
      await onSaveGrades()
      toast.success('All grades saved successfully!')
      setLocalGrades({})
    } catch (error) {
      toast.error('Failed to save some grades')
    } finally {
      setSavingGrades(false)
    }
  }

  const getGradeColor = (letterGrade: string) => {
    switch (letterGrade) {
      case 'A': return 'bg-green-100 text-green-700 border-green-300'
      case 'B': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'C': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'D': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'F': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const hasUnsavedChanges = Object.keys(localGrades).length > 0

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Assessment Selected</h3>
        <p className="text-sm text-slate-600">Please select an assessment to begin grading</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-600">Loading students...</p>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl">
        <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Students Found</h3>
        <p className="text-sm text-slate-600 mb-4">
          No students are enrolled in this class yet.
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    )
  }

  // Calculate statistics
  const totalStudents = students.length
  const gradedStudents = Object.keys(grades).length
  const averageScore = Object.values(grades).reduce((acc, g) => acc + g.percentage, 0) / gradedStudents || 0
  const completionRate = (gradedStudents / totalStudents) * 100

  return (
    <div className="space-y-4">
      {/* Statistics Bar */}
      {showAnalytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Total Students</span>
            </div>
            <p className="text-lg font-bold text-blue-700 mt-1">{totalStudents}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Graded</span>
            </div>
            <p className="text-lg font-bold text-green-700 mt-1">{gradedStudents}/{totalStudents}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Average</span>
            </div>
            <p className="text-lg font-bold text-purple-700 mt-1">{averageScore.toFixed(1)}%</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">Completion</span>
            </div>
            <p className="text-lg font-bold text-orange-700 mt-1">{completionRate.toFixed(0)}%</p>
          </div>
        </div>
      )}

      {/* Student Grade List */}
      {mode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {students.map((student, index) => {
            const grade = grades[student.id] || localGrades[student.id]
            const hasGrade = !!grade?.score
            
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-4 bg-white border rounded-xl hover:shadow-md transition-all ${
                  hasGrade ? 'border-green-200 bg-green-50/30' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Student Info */}
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800">
                      {student.full_name || `${student.first_name} ${student.last_name}`}
                    </h4>
                    <p className="text-xs text-slate-500">
                      ID: {student.student_number || student.student_id || 'N/A'}
                    </p>
                  </div>
                  
                  {/* Score Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Score"
                      min="0"
                      max={assessment.max_score}
                      value={grade?.score || ''}
                      onChange={(e) => handleScoreChange(student.id, parseFloat(e.target.value) || 0)}
                      className="w-24 text-center"
                    />
                    <span className="text-sm text-slate-500">/ {assessment.max_score}</span>
                    {hasGrade && (
                      <Badge className={`ml-auto ${getGradeColor(grade.letter_grade)}`}>
                        {grade.letter_grade} ({Math.round(grade.percentage)}%)
                      </Badge>
                    )}
                  </div>
                  
                  {/* Feedback (if enabled) */}
                  {showFeedback && (
                    <Textarea
                      placeholder="Add feedback..."
                      value={grade?.feedback || ''}
                      onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                      className="text-xs h-16 resize-none"
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : mode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Student Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Student ID</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-600">Score</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-600">Percentage</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-600">Grade</th>
                {showFeedback && (
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                const grade = grades[student.id] || localGrades[student.id]
                const hasGrade = !!grade?.score
                const isExpanded = expandedStudent === student.id
                
                return (
                  <React.Fragment key={student.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        hasGrade ? 'bg-green-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm text-slate-800">
                            {student.full_name || `${student.first_name} ${student.last_name}`}
                          </p>
                          {student.class_name && (
                            <p className="text-xs text-slate-500">{student.class_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {student.student_number || student.student_id || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max={assessment.max_score}
                            value={grade?.score || ''}
                            onChange={(e) => handleScoreChange(student.id, parseFloat(e.target.value) || 0)}
                            className="w-20 text-center text-sm"
                          />
                          <span className="text-sm text-slate-500">/{assessment.max_score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasGrade ? (
                          <span className="font-medium text-sm">
                            {Math.round(grade.percentage)}%
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasGrade ? (
                          <Badge className={getGradeColor(grade.letter_grade)}>
                            {grade.letter_grade}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      {showFeedback && (
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                            className="text-slate-600 hover:text-blue-600"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </motion.tr>
                    {showFeedback && isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 bg-slate-50">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600">
                              Feedback for {student.first_name}:
                            </label>
                            <Textarea
                              placeholder="Add detailed feedback..."
                              value={grade?.feedback || ''}
                              onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                              className="w-full text-sm"
                              rows={3}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Compact mode
        <div className="space-y-2">
          {students.map((student, index) => {
            const grade = grades[student.id] || localGrades[student.id]
            const hasGrade = !!grade?.score
            
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-all ${
                  hasGrade ? 'border-green-200 bg-green-50/30' : 'border-slate-200'
                }`}
              >
                <span className="text-xs text-slate-500 w-8">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">
                    {student.full_name || `${student.first_name} ${student.last_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Score"
                    min="0"
                    max={assessment.max_score}
                    value={grade?.score || ''}
                    onChange={(e) => handleScoreChange(student.id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-center text-sm"
                  />
                  <span className="text-xs text-slate-500">/{assessment.max_score}</span>
                  {hasGrade && (
                    <Badge className={`text-xs ${getGradeColor(grade.letter_grade)}`}>
                      {grade.letter_grade}
                    </Badge>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Save Button */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-4 flex justify-center mt-6">
          <Button
            onClick={handleSaveAll}
            disabled={savingGrades}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {savingGrades ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving Grades...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save All Grades ({Object.keys(localGrades).length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
