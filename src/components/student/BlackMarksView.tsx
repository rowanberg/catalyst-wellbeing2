'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle, 
  FileText, 
  MessageSquare, 
  User, 
  Target, 
  BookOpen,
  Users,
  Shield,
  AlertCircle,
  Send,
  TrendingUp,
  Award,
  Sparkles,
  Filter,
  Search,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'

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
  { value: 'behavioral', label: 'Behavioral', icon: Users, color: 'bg-red-100 text-red-800' },
  { value: 'academic', label: 'Academic', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  { value: 'attendance', label: 'Attendance', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'conduct', label: 'Conduct', icon: Shield, color: 'bg-purple-100 text-purple-800' },
  { value: 'safety', label: 'Safety', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' }
]

const REMEDY_TYPES = [
  { value: 'assignment', label: 'Written Assignment', icon: FileText },
  { value: 'community_service', label: 'Community Service', icon: Users },
  { value: 'reflection', label: 'Reflection Essay', icon: MessageSquare },
  { value: 'apology', label: 'Formal Apology', icon: MessageSquare },
  { value: 'behavior_plan', label: 'Behavior Plan', icon: Target },
  { value: 'parent_meeting', label: 'Parent Meeting', icon: Users },
  { value: 'detention', label: 'Detention', icon: Clock },
  { value: 'counseling', label: 'Counseling Session', icon: MessageSquare }
]

export default function BlackMarksView() {
  const [blackMarks, setBlackMarks] = useState<BlackMark[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [submissionText, setSubmissionText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBlackMark, setSelectedBlackMark] = useState<BlackMark | null>(null)

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-4">
            <motion.div
              className="absolute inset-0 border-4 border-blue-200 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-4 border-transparent border-t-blue-500 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Records</h3>
          <p className="text-gray-600 text-sm">Fetching your disciplinary records...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header with Glass Effect */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mr-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Disciplinary Records
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Track and resolve your academic conduct records
              </p>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Overview with Modern Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="group"
          >
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      <p className="text-sm font-medium text-red-100">Active Issues</p>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold mb-1">{activeCount}</p>
                    <p className="text-xs text-red-100">Require attention</p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                  >
                    <AlertTriangle className="h-6 w-6" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <p className="text-sm font-medium text-green-100">Resolved</p>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold mb-1">{resolvedCount}</p>
                    <p className="text-xs text-green-100">Successfully completed</p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                  >
                    <Award className="h-6 w-6" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="group sm:col-span-2 lg:col-span-1"
          >
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5" />
                      <p className="text-sm font-medium text-blue-100">Success Rate</p>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold mb-2">
                      {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}%
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-2 mb-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-white h-2 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-blue-100">Resolution progress</p>
                  </div>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                  >
                    <Sparkles className="h-6 w-6" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Modern Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/50 border-gray-200 hover:bg-white/80 rounded-xl"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 pt-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CATEGORIES.map((category) => (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(selectedCategory === category.value ? 'all' : category.value)}
                      className="justify-start text-xs"
                    >
                      <category.icon className="h-3 w-3 mr-2" />
                      {category.label}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Modern Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/80 backdrop-blur-xl rounded-2xl p-1 shadow-lg border border-white/20">
              <TabsTrigger value="all" className="rounded-xl text-xs sm:text-sm">
                All <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full text-xs">{totalCount}</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-xl text-xs sm:text-sm">
                Active <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">{activeCount}</span>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="rounded-xl text-xs sm:text-sm">
                Progress <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">{blackMarks.filter(bm => bm.status === 'in_progress').length}</span>
              </TabsTrigger>
              <TabsTrigger value="resolved" className="rounded-xl text-xs sm:text-sm">
                Resolved <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">{resolvedCount}</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredBlackMarks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-12 text-center shadow-xl border border-white/20"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="h-10 w-10 text-white" />
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {activeTab === 'all' ? 'No Records Found' : `No ${activeTab.replace('_', ' ')} Records`}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                  {activeTab === 'all' 
                    ? "Great job! You don't have any black marks."
                    : `You don't have any ${activeTab.replace('_', ' ')} black marks.`
                  }
                </p>
              </motion.div>
            ) : (
              filteredBlackMarks.map((blackMark, index) => {
                const StatusIcon = getStatusIcon(blackMark.status)
                const category = CATEGORIES.find(cat => cat.value === blackMark.category)
                const remedyType = REMEDY_TYPES.find(rt => rt.value === blackMark.remedy_type)
                const isOverdue = blackMark.remedy_due_date && new Date(blackMark.remedy_due_date) < new Date() && blackMark.status !== 'resolved'
                
                return (
                  <motion.div
                    key={blackMark.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`group bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${
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
    </div>
  )
}
