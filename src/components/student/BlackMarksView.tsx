'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle, 
  FileText, 
  Upload, 
  MessageSquare, 
  User, 
  Target, 
  BookOpen,
  Users,
  Shield,
  AlertCircle,
  Send,
  Eye,
  Download
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface BlackMark {
  id: string
  title: string
  description: string
  category: string
  severity: string
  remedy_description: string
  remedy_type: string
  remedy_due_date: string | null
  status: string
  teacher_name: string
  created_at: string
  resolution_notes: string | null
  resolved_at: string | null
  submissions: BlackMarkSubmission[]
}

interface BlackMarkSubmission {
  id: string
  submission_text: string
  submission_files: string[]
  submitted_at: string
  teacher_feedback: string | null
  status: string
  reviewed_at: string | null
}

const CATEGORIES = [
  { value: 'behavioral', label: 'Behavioral', icon: Users, color: 'bg-red-100 text-red-800', description: 'Issues related to classroom behavior and interactions' },
  { value: 'academic', label: 'Academic', icon: BookOpen, color: 'bg-blue-100 text-blue-800', description: 'Academic performance and assignment issues' },
  { value: 'attendance', label: 'Attendance', icon: Clock, color: 'bg-yellow-100 text-yellow-800', description: 'Attendance and punctuality concerns' },
  { value: 'conduct', label: 'Conduct', icon: Shield, color: 'bg-purple-100 text-purple-800', description: 'General conduct and school policy violations' },
  { value: 'safety', label: 'Safety', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800', description: 'Safety violations and dangerous behavior' }
]

const REMEDY_TYPES = [
  { value: 'assignment', label: 'Written Assignment', icon: FileText, description: 'Complete a specific written assignment' },
  { value: 'community_service', label: 'Community Service', icon: Users, description: 'Perform community service hours' },
  { value: 'reflection', label: 'Reflection Essay', icon: MessageSquare, description: 'Write a reflective essay about the incident' },
  { value: 'apology', label: 'Formal Apology', icon: MessageSquare, description: 'Write and deliver a formal apology' },
  { value: 'behavior_plan', label: 'Behavior Plan', icon: Target, description: 'Create and follow a behavior improvement plan' },
  { value: 'parent_meeting', label: 'Parent Meeting', icon: Users, description: 'Attend a meeting with parents and teacher' },
  { value: 'detention', label: 'Detention', icon: Clock, description: 'Serve detention time' },
  { value: 'counseling', label: 'Counseling Session', icon: MessageSquare, description: 'Attend counseling sessions' }
]

export default function BlackMarksView() {
  const [blackMarks, setBlackMarks] = useState<BlackMark[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedBlackMark, setSelectedBlackMark] = useState<BlackMark | null>(null)
  const [submissionText, setSubmissionText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBlackMarks()
  }, [])

  const fetchBlackMarks = async () => {
    try {
      const response = await fetch('/api/student/black-marks')
      if (response.ok) {
        const data = await response.json()
        setBlackMarks(data.blackMarks)
      }
    } catch (error: any) {
      console.error('Error fetching black marks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRemedy = async (blackMarkId: string) => {
    if (!submissionText.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/student/black-marks/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blackMarkId,
          submissionText,
          submissionFiles: []
        }),
      })

      if (response.ok) {
        setSubmissionText('')
        setSelectedBlackMark(null)
        fetchBlackMarks()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit remedy')
      }
    } catch (error: any) {
      console.error('Error submitting remedy:', error)
      alert('Failed to submit remedy')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'major': return 'bg-orange-100 text-orange-800'
      case 'severe': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return AlertCircle
      case 'in_progress': return Clock
      case 'completed': return CheckCircle
      case 'resolved': return CheckCircle
      default: return AlertCircle
    }
  }

  const filteredBlackMarks = blackMarks.filter(mark => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return mark.status === 'active'
    if (activeTab === 'in_progress') return mark.status === 'in_progress'
    if (activeTab === 'resolved') return mark.status === 'resolved'
    return true
  })

  const activeCount = blackMarks.filter(bm => bm.status === 'active').length
  const resolvedCount = blackMarks.filter(bm => bm.status === 'resolved').length
  const totalCount = blackMarks.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Black Marks</h2>
        <p className="text-gray-600">
          Track your disciplinary records and complete remedial actions to resolve them
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Active Black Marks</p>
                <p className="text-2xl font-bold text-red-800">{activeCount}</p>
                <p className="text-xs text-red-600">Need immediate attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Resolved</p>
                <p className="text-2xl font-bold text-green-800">{resolvedCount}</p>
                <p className="text-xs text-green-600">Successfully completed</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Resolution Rate</p>
                <p className="text-2xl font-bold text-blue-800">
                  {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}%
                </p>
                <Progress 
                  value={totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0} 
                  className="mt-1 h-2"
                />
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({blackMarks.filter(bm => bm.status === 'in_progress').length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredBlackMarks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'all' ? 'No Black Marks' : `No ${activeTab.replace('_', ' ')} Black Marks`}
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'all' 
                    ? "Great job! You don't have any black marks."
                    : `You don't have any ${activeTab.replace('_', ' ')} black marks.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBlackMarks.map((blackMark) => {
              const StatusIcon = getStatusIcon(blackMark.status)
              const category = CATEGORIES.find(cat => cat.value === blackMark.category)
              const remedyType = REMEDY_TYPES.find(rt => rt.value === blackMark.remedy_type)
              const isOverdue = blackMark.remedy_due_date && new Date(blackMark.remedy_due_date) < new Date() && blackMark.status !== 'resolved'
              
              return (
                <motion.div
                  key={blackMark.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg border-2 p-6 hover:shadow-lg transition-all ${
                    isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{blackMark.title}</h3>
                        <Badge className={getStatusColor(blackMark.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {blackMark.status.replace('_', ' ')}
                        </Badge>
                        {category && (
                          <Badge className={category.color}>
                            <category.icon className="h-3 w-3 mr-1" />
                            {category.label}
                          </Badge>
                        )}
                        <Badge className={getSeverityColor(blackMark.severity)}>
                          {blackMark.severity}
                        </Badge>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-800 animate-pulse">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <User className="h-4 w-4 mr-1" />
                        <span>Issued by {blackMark.teacher_name}</span>
                        <span className="mx-2">•</span>
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(blackMark.created_at).toLocaleDateString()}</span>
                        {blackMark.remedy_due_date && (
                          <>
                            <span className="mx-2">•</span>
                            <Clock className="h-4 w-4 mr-1" />
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              Due: {new Date(blackMark.remedy_due_date).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{blackMark.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2 text-blue-500" />
                        How to Remove This Black Mark
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        {remedyType && (
                          <div className="flex items-center mb-2">
                            <remedyType.icon className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="font-medium text-blue-800">{remedyType.label}</span>
                          </div>
                        )}
                        <p className="text-blue-900">{blackMark.remedy_description}</p>
                      </div>
                    </div>

                    {/* Submissions Section */}
                    {blackMark.submissions && blackMark.submissions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Your Submissions</h4>
                        <div className="space-y-2">
                          {blackMark.submissions.map((submission) => (
                            <div key={submission.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                  Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                                </span>
                                <Badge className={
                                  submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  submission.status === 'needs_revision' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {submission.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-gray-700 text-sm">{submission.submission_text}</p>
                              {submission.teacher_feedback && (
                                <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                  <p className="text-sm text-blue-800">
                                    <strong>Teacher Feedback:</strong> {submission.teacher_feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolution Notes */}
                    {blackMark.status === 'resolved' && blackMark.resolution_notes && (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolution Notes
                        </h4>
                        <p className="text-green-700">{blackMark.resolution_notes}</p>
                        <p className="text-sm text-green-600 mt-2">
                          Resolved on: {blackMark.resolved_at ? new Date(blackMark.resolved_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {blackMark.status === 'active' && (
                      <div className="flex space-x-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              <Send className="h-4 w-4 mr-2" />
                              Submit Remedy
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Submit Remedy for: {blackMark.title}</DialogTitle>
                              <DialogDescription>
                                Complete the required remedy to resolve this black mark.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">Required Action:</h4>
                                <p className="text-blue-700">{blackMark.remedy_description}</p>
                              </div>
                              
                              <div>
                                <Label htmlFor="submission">Your Response</Label>
                                <Textarea
                                  id="submission"
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  placeholder="Describe how you have completed the required remedy..."
                                  rows={5}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setSubmissionText('')}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => handleSubmitRemedy(blackMark.id)}
                                  disabled={!submissionText.trim() || submitting}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {submitting ? 'Submitting...' : 'Submit Remedy'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
