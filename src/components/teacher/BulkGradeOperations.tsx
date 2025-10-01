'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Zap, 
  Copy, 
  Calculator,
  RefreshCw,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  BarChart3,
  Clock,
  Award
} from 'lucide-react'
import { toast } from 'sonner'

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
}

interface Grade {
  id: string
  student_id: string
  score: number
  percentage: number
  letter_grade: string
  feedback?: string
}

interface BulkOperation {
  type: 'apply_score' | 'apply_curve' | 'apply_feedback' | 'recalculate' | 'excuse' | 'late_penalty'
  description: string
  icon: any
  color: string
}

interface BulkGradeOperationsProps {
  students: Student[]
  assessment: Assessment
  grades: { [studentId: string]: Grade }
  onBulkUpdate: (studentIds: string[], operation: any) => Promise<void>
}

export default function BulkGradeOperations({ 
  students, 
  assessment, 
  grades, 
  onBulkUpdate 
}: BulkGradeOperationsProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [activeOperation, setActiveOperation] = useState<string | null>(null)
  const [operationData, setOperationData] = useState<any>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const bulkOperations: BulkOperation[] = [
    {
      type: 'apply_score',
      description: 'Apply same score to selected students',
      icon: Calculator,
      color: 'blue'
    },
    {
      type: 'apply_curve',
      description: 'Apply grade curve adjustment',
      icon: BarChart3,
      color: 'green'
    },
    {
      type: 'apply_feedback',
      description: 'Add feedback to multiple students',
      icon: Edit,
      color: 'purple'
    },
    {
      type: 'recalculate',
      description: 'Recalculate grades with new scale',
      icon: RefreshCw,
      color: 'orange'
    },
    {
      type: 'excuse',
      description: 'Mark assignments as excused',
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      type: 'late_penalty',
      description: 'Apply late submission penalty',
      icon: Clock,
      color: 'red'
    }
  ]

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.id))
    }
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleOperationSelect = (operationType: string) => {
    setActiveOperation(operationType)
    setOperationData({})
  }

  const executeOperation = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student')
      return
    }

    if (!activeOperation) {
      toast.error('Please select an operation')
      return
    }

    setIsProcessing(true)
    try {
      await onBulkUpdate(selectedStudents, {
        type: activeOperation,
        data: operationData
      })
      
      toast.success(`Applied ${activeOperation.replace('_', ' ')} to ${selectedStudents.length} students`)
      setActiveOperation(null)
      setOperationData({})
      setSelectedStudents([])
    } catch (error) {
      console.error('Bulk operation failed:', error)
      toast.error('Operation failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStudentGradeStatus = (studentId: string) => {
    const grade = grades[studentId]
    if (!grade) return { status: 'missing', color: 'gray', text: 'No Grade' }
    
    if (grade.percentage >= 90) return { status: 'excellent', color: 'green', text: 'A' }
    if (grade.percentage >= 80) return { status: 'good', color: 'blue', text: 'B' }
    if (grade.percentage >= 70) return { status: 'satisfactory', color: 'yellow', text: 'C' }
    if (grade.percentage >= 60) return { status: 'needs_improvement', color: 'orange', text: 'D' }
    return { status: 'failing', color: 'red', text: 'F' }
  }

  const renderOperationForm = () => {
    switch (activeOperation) {
      case 'apply_score':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Score to Apply</label>
              <Input
                type="number"
                placeholder="Enter score"
                value={operationData.score || ''}
                onChange={(e) => setOperationData((prev: any) => ({ ...prev, score: Number(e.target.value) }))}
                max={assessment.max_score}
              />
              <p className="text-xs text-gray-500 mt-1">Max score: {assessment.max_score}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reason (Optional)</label>
              <Input
                placeholder="e.g., Full credit for participation"
                value={operationData.reason || ''}
                onChange={(e) => setOperationData((prev: any) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
        )

      case 'apply_curve':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Curve Type</label>
              <Select 
                value={operationData.curveType || ''} 
                onValueChange={(value) => setOperationData((prev: any) => ({ ...prev, curveType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select curve type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add_points">Add Points</SelectItem>
                  <SelectItem value="multiply">Multiply by Factor</SelectItem>
                  <SelectItem value="set_highest">Set Highest to 100%</SelectItem>
                  <SelectItem value="bell_curve">Bell Curve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {operationData.curveType === 'add_points' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Points to Add</label>
                <Input
                  type="number"
                  placeholder="Enter points"
                  value={operationData.points || ''}
                  onChange={(e) => setOperationData((prev: any) => ({ ...prev, points: Number(e.target.value) }))}
                />
              </div>
            )}
            
            {operationData.curveType === 'multiply' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Multiplication Factor</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 1.1 for 10% increase"
                  value={operationData.factor || ''}
                  onChange={(e) => setOperationData((prev: any) => ({ ...prev, factor: Number(e.target.value) }))}
                />
              </div>
            )}
          </div>
        )

      case 'apply_feedback':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Feedback Message</label>
              <Textarea
                placeholder="Enter feedback to apply to all selected students"
                value={operationData.feedback || ''}
                onChange={(e) => setOperationData((prev: any) => ({ ...prev, feedback: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={operationData.append || false}
                onCheckedChange={(checked: any) => setOperationData((prev: any) => ({ ...prev, append: checked }))}
              />
              <label className="text-sm text-gray-700">Append to existing feedback</label>
            </div>
          </div>
        )

      case 'late_penalty':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Penalty Type</label>
              <Select 
                value={operationData.penaltyType || ''} 
                onValueChange={(value) => setOperationData((prev: any) => ({ ...prev, penaltyType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select penalty type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Reduction</SelectItem>
                  <SelectItem value="points">Point Deduction</SelectItem>
                  <SelectItem value="letter_grade">Letter Grade Drop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {operationData.penaltyType === 'percentage' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Percentage to Deduct</label>
                <Input
                  type="number"
                  placeholder="e.g., 10 for 10% penalty"
                  value={operationData.percentage || ''}
                  onChange={(e) => setOperationData((prev: any) => ({ ...prev, percentage: Number(e.target.value) }))}
                  max={100}
                />
              </div>
            )}
            
            {operationData.penaltyType === 'points' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Points to Deduct</label>
                <Input
                  type="number"
                  placeholder="Enter points"
                  value={operationData.points || ''}
                  onChange={(e) => setOperationData((prev: any) => ({ ...prev, points: Number(e.target.value) }))}
                />
              </div>
            )}
          </div>
        )

      case 'excuse':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Excuse Reason</label>
              <Select 
                value={operationData.reason || ''} 
                onValueChange={(value) => setOperationData((prev: any) => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="absent">Student Absent</SelectItem>
                  <SelectItem value="medical">Medical Excuse</SelectItem>
                  <SelectItem value="family_emergency">Family Emergency</SelectItem>
                  <SelectItem value="technical_issues">Technical Issues</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {operationData.reason === 'other' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Custom Reason</label>
                <Input
                  placeholder="Enter custom reason"
                  value={operationData.customReason || ''}
                  onChange={(e) => setOperationData((prev: any) => ({ ...prev, customReason: e.target.value }))}
                />
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Bulk Grade Operations
          </h2>
          <p className="text-gray-600 text-sm">Apply operations to multiple students simultaneously</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            {selectedStudents.length} selected
          </Badge>
          {activeOperation && (
            <Button 
              onClick={executeOperation}
              disabled={isProcessing || selectedStudents.length === 0}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isProcessing ? 'Processing...' : 'Execute Operation'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students ({students.length})
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => {
                const isSelected = selectedStudents.includes(student.id)
                const gradeStatus = getStudentGradeStatus(student.id)
                
                return (
                  <motion.div
                    key={student.id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => handleStudentToggle(student.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleStudentToggle(student.id)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{student.class_name}</div>
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        gradeStatus.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                        gradeStatus.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        gradeStatus.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        gradeStatus.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        gradeStatus.color === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {gradeStatus.text}
                    </Badge>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Operation Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Bulk Operations
            </CardTitle>
            <CardDescription>
              Choose an operation to apply to selected students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bulkOperations.map((operation) => {
                const Icon = operation.icon
                const isActive = activeOperation === operation.type
                
                return (
                  <motion.button
                    key={operation.type}
                    onClick={() => handleOperationSelect(operation.type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      isActive 
                        ? `border-${operation.color}-500 bg-${operation.color}-50` 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${operation.color}-100`}>
                        <Icon className={`h-4 w-4 text-${operation.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 capitalize">
                          {operation.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {operation.description}
                        </div>
                      </div>
                      {isActive && (
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Operation Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Operation Details
            </CardTitle>
            <CardDescription>
              Configure the selected operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeOperation ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 capitalize">
                    {activeOperation.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Will be applied to {selectedStudents.length} selected student{selectedStudents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {renderOperationForm()}
                
                {selectedStudents.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-amber-600 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>This action cannot be undone</span>
                    </div>
                    <Button 
                      onClick={executeOperation}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Apply to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h4 className="font-medium text-gray-700 mb-1">
                  Select an Operation
                </h4>
                <p className="text-sm text-gray-500">
                  Choose a bulk operation from the list to configure it
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
