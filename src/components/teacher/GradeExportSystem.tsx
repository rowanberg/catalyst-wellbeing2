'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Download, 
  FileText, 
  Table, 
  Mail,
  Share2,
  Filter,
  Calendar,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  FileImage,
  Send
} from 'lucide-react'
import { toast } from 'sonner'

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  includeStudentInfo: boolean
  includeRubricScores: boolean
  includeFeedback: boolean
  includeAnalytics: boolean
  dateRange: 'all' | 'current_term' | 'last_month' | 'custom'
  groupBy: 'student' | 'assessment' | 'class'
}

interface Assessment {
  id: string
  title: string
  type: string
  max_score: number
  created_at: string
  class_id: string
}

interface GradeExportSystemProps {
  assessments: Assessment[]
  onExport: (selectedAssessments: string[], options: ExportOptions) => Promise<void>
}

export default function GradeExportSystem({ assessments, onExport }: GradeExportSystemProps) {
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([])
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    includeStudentInfo: true,
    includeRubricScores: true,
    includeFeedback: true,
    includeAnalytics: false,
    dateRange: 'current_term',
    groupBy: 'student'
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleSelectAll = () => {
    if (selectedAssessments.length === assessments.length) {
      setSelectedAssessments([])
    } else {
      setSelectedAssessments(assessments.map(a => a.id))
    }
  }

  const handleAssessmentToggle = (assessmentId: string) => {
    setSelectedAssessments(prev => 
      prev.includes(assessmentId)
        ? prev.filter(id => id !== assessmentId)
        : [...prev, assessmentId]
    )
  }

  const handleExport = async () => {
    if (selectedAssessments.length === 0) {
      toast.error('Please select at least one assessment to export')
      return
    }

    setIsExporting(true)
    try {
      await onExport(selectedAssessments, exportOptions)
      toast.success(`Exported ${selectedAssessments.length} assessments as ${exportOptions.format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />
      case 'csv': return <Table className="h-4 w-4" />
      case 'pdf': return <FileText className="h-4 w-4" />
      case 'json': return <FileImage className="h-4 w-4" />
      default: return <Download className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Grade Export & Publishing
          </h2>
          <p className="text-gray-600 text-sm">Export grades to external systems or share with stakeholders</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {selectedAssessments.length} selected
          </Badge>
          <Button 
            onClick={handleExport}
            disabled={isExporting || selectedAssessments.length === 0}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              getFormatIcon(exportOptions.format)
            )}
            {isExporting ? 'Exporting...' : 'Export Grades'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessment Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Select Assessments
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedAssessments.length === assessments.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardTitle>
              <CardDescription>
                Choose which assessments to include in your export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {assessments.map((assessment, index) => {
                  const isSelected = selectedAssessments.includes(assessment.id)
                  return (
                    <motion.div
                      key={assessment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleAssessmentToggle(assessment.id)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {assessment.title}
                          </h4>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            {assessment.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Max Score: {assessment.max_score}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Export Format</label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      CSV (.csv)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF Report
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      JSON Data
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date Range</label>
              <Select 
                value={exportOptions.dateRange} 
                onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="current_term">Current Term</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group By */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Group By</label>
              <Select 
                value={exportOptions.groupBy} 
                onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, groupBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Options */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Include in Export</label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={exportOptions.includeStudentInfo}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeStudentInfo: !!checked }))
                    }
                  />
                  <label className="text-sm text-gray-700">Student Information</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={exportOptions.includeRubricScores}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeRubricScores: !!checked }))
                    }
                  />
                  <label className="text-sm text-gray-700">Rubric Scores</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={exportOptions.includeFeedback}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeFeedback: !!checked }))
                    }
                  />
                  <label className="text-sm text-gray-700">Teacher Feedback</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={exportOptions.includeAnalytics}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeAnalytics: !!checked }))
                    }
                  />
                  <label className="text-sm text-gray-700">Analytics Summary</label>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center gap-2"
                onClick={() => toast.info('Email functionality would be implemented here')}
              >
                <Mail className="h-4 w-4" />
                Email to Parents
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center gap-2"
                onClick={() => toast.info('LMS integration would be implemented here')}
              >
                <Share2 className="h-4 w-4" />
                Push to LMS
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center gap-2"
                onClick={() => toast.info('Student portal publishing would be implemented here')}
              >
                <Send className="h-4 w-4" />
                Publish to Students
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Preview */}
      {selectedAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Export Preview
            </CardTitle>
            <CardDescription>
              Preview of what will be included in your export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedAssessments.length}
                </div>
                <div className="text-sm text-blue-800">Assessments</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ~{selectedAssessments.length * 25}
                </div>
                <div className="text-sm text-green-800">Student Grades</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {exportOptions.format.toUpperCase()}
                </div>
                <div className="text-sm text-purple-800">Export Format</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Export will include:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Basic grade data
                </div>
                {exportOptions.includeStudentInfo && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Student information
                  </div>
                )}
                {exportOptions.includeRubricScores && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Rubric breakdowns
                  </div>
                )}
                {exportOptions.includeFeedback && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Teacher feedback
                  </div>
                )}
                {exportOptions.includeAnalytics && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Analytics summary
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
