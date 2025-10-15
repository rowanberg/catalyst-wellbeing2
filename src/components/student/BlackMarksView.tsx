'use client'

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
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

  const fetchBlackMarks = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchBlackMarks()
  }, [fetchBlackMarks])

  const handleSubmitRemedy = useCallback(async (blackMarkId: string) => {
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
  }, [submissionText, fetchBlackMarks])

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

  // Memoized filtered data for better performance
  const filteredBlackMarks = useMemo(() => {
    let filtered = blackMarks
    
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(mark => mark.status === activeTab)
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      filtered = filtered.filter(mark => 
        mark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mark.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(mark => mark.category === selectedCategory)
    }
    
    return filtered
  }, [blackMarks, activeTab, searchQuery, selectedCategory])

  const { activeCount, resolvedCount, inProgressCount, totalCount } = useMemo(() => ({
    activeCount: blackMarks.filter(bm => bm.status === 'active').length,
    resolvedCount: blackMarks.filter(bm => bm.status === 'resolved').length,
    inProgressCount: blackMarks.filter(bm => bm.status === 'in_progress').length,
    totalCount: blackMarks.length
  }), [blackMarks])

  // Optimized loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 border-3 border-blue-200 rounded-full animate-spin" />
            <div className="absolute inset-2 border-3 border-transparent border-t-blue-600 rounded-full animate-spin" style={{ animationDuration: '0.8s' }} />
          </div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        {/* Optimized Compact Header */}
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Disciplinary Records
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                Track and resolve your conduct records
              </p>
            </div>
          </div>
        </div>

        {/* Optimized Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <p className="text-xl sm:text-3xl font-bold">{activeCount}</p>
                <p className="text-[10px] sm:text-xs text-red-100 mt-0.5">Active</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <p className="text-xl sm:text-3xl font-bold">{resolvedCount}</p>
                <p className="text-[10px] sm:text-xs text-green-100 mt-0.5">Resolved</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <p className="text-xl sm:text-3xl font-bold">
                  {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}%
                </p>
                <p className="text-[10px] sm:text-xs text-blue-100 mt-0.5">Success</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimized Search and Filter */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 px-3"
            >
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filters</span>
              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-3 border-t border-gray-200 mt-3">
                  {CATEGORIES.map((category) => (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(selectedCategory === category.value ? 'all' : category.value)}
                      className="h-8 text-xs justify-start"
                    >
                      <category.icon className="h-3 w-3 mr-1.5" />
                      <span className="truncate">{category.label}</span>
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile-Optimized Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-200">
            <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto gap-1">
              <TabsTrigger value="all" className="h-9 rounded-lg text-xs sm:text-sm px-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <span className="hidden sm:inline">All</span>
                <span className="sm:hidden">All</span>
                <span className="ml-1 text-[10px] sm:text-xs font-semibold">{totalCount}</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="h-9 rounded-lg text-xs sm:text-sm px-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <span className="hidden sm:inline">Active</span>
                <span className="sm:hidden truncate">Act</span>
                <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs font-semibold">{activeCount}</span>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="h-9 rounded-lg text-xs sm:text-sm px-2 data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
                <span className="hidden sm:inline">Progress</span>
                <span className="sm:hidden truncate">Prog</span>
                <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs font-semibold">{inProgressCount}</span>
              </TabsTrigger>
              <TabsTrigger value="resolved" className="h-9 rounded-lg text-xs sm:text-sm px-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <span className="hidden sm:inline">Resolved</span>
                <span className="sm:hidden truncate">Res</span>
                <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs font-semibold">{resolvedCount}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="space-y-3 mt-3">
            {filteredBlackMarks.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-gray-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {activeTab === 'all' ? 'No Records Found' : `No ${activeTab.replace('_', ' ')} Records`}
                </h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  {activeTab === 'all' 
                    ? "Great job! You don't have any black marks."
                    : `You don't have any ${activeTab.replace('_', ' ')} black marks.`
                  }
                </p>
              </div>
            ) : (
              filteredBlackMarks.map((blackMark, index) => {
                const StatusIcon = getStatusIcon(blackMark.status)
                const category = CATEGORIES.find(cat => cat.value === blackMark.category)
                const remedyType = REMEDY_TYPES.find(rt => rt.value === blackMark.remedy_type)
                const isOverdue = blackMark.remedy_due_date && new Date(blackMark.remedy_due_date) < new Date() && blackMark.status !== 'resolved'
                
                return (
                  <div
                    key={blackMark.id}
                    className={`bg-white rounded-2xl p-3 sm:p-4 shadow-sm border transition-colors ${
                      isOverdue ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                    }`}
                  >
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{blackMark.title}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge className={`${getStatusColor(blackMark.status)} text-[10px] sm:text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {blackMark.status.replace('_', ' ')}
                        </Badge>
                        {category && (
                          <Badge className={`${category.color} text-[10px] sm:text-xs`}>
                            <category.icon className="h-3 w-3 mr-1" />
                            {category.label}
                          </Badge>
                        )}
                        <Badge className={`${getSeverityColor(blackMark.severity)} text-[10px] sm:text-xs`}>
                          {blackMark.severity}
                        </Badge>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-800 text-[10px] sm:text-xs animate-pulse">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                      
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>{blackMark.teacher_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>{new Date(blackMark.created_at).toLocaleDateString()}</span>
                      </div>
                      {blackMark.remedy_due_date && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            Due: {new Date(blackMark.remedy_due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mt-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1.5">Description</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg">{blackMark.description}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1.5 flex items-center">
                        <Target className="h-4 w-4 mr-1.5 text-blue-600" />
                        How to Remove
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        {remedyType && (
                          <div className="flex items-center mb-1.5">
                            <remedyType.icon className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                            <span className="text-xs sm:text-sm font-medium text-blue-800">{remedyType.label}</span>
                          </div>
                        )}
                        <p className="text-xs sm:text-sm text-blue-900">{blackMark.remedy_description}</p>
                      </div>
                    </div>

                    {/* Submissions Section */}
                    {blackMark.submissions && blackMark.submissions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1.5">Your Submissions</h4>
                        <div className="space-y-2">
                          {blackMark.submissions.map((submission) => (
                            <div key={submission.id} className="bg-gray-50 p-2.5 rounded-lg">
                              <div className="flex items-center justify-between mb-1.5 gap-2">
                                <span className="text-xs text-gray-600 truncate">
                                  {new Date(submission.submitted_at).toLocaleDateString()}
                                </span>
                                <Badge className={`text-[10px] flex-shrink-0 ${
                                  submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  submission.status === 'needs_revision' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {submission.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-700">{submission.submission_text}</p>
                              {submission.teacher_feedback && (
                                <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                                  <p className="text-xs text-blue-800">
                                    <strong>Feedback:</strong> {submission.teacher_feedback}
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
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800 mb-1.5 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Resolution Notes
                        </h4>
                        <p className="text-xs sm:text-sm text-green-700">{blackMark.resolution_notes}</p>
                        <p className="text-xs text-green-600 mt-1.5">
                          Resolved: {blackMark.resolved_at ? new Date(blackMark.resolved_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {blackMark.status === 'active' && (
                      <div className="pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-9 text-sm">
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
                </div>
              )
            })
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
