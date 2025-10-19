'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Checkbox } from '@/components/ui/checkbox' // Component not available, using HTML checkbox
import { 
  BarChart3, 
  PieChart, 
  Plus, 
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Vote,
  Target,
  Share,
  Download
} from 'lucide-react'
import Link from 'next/link'

interface Poll {
  id: string
  title: string
  description: string
  type: 'poll' | 'survey'
  status: 'draft' | 'active' | 'completed' | 'archived'
  targetAudience: 'students' | 'teachers' | 'parents' | 'all'
  createdDate: string
  endDate: string
  responses: number
  totalTargets: number
  questions: Question[]
}

interface Question {
  id: string
  text: string
  type: 'multiple_choice' | 'single_choice' | 'text' | 'rating' | 'yes_no'
  options: string[]
  required: boolean
}

interface PollResult {
  questionId: string
  questionText: string
  responses: { [key: string]: number }
  totalResponses: number
}

export default function PollsSurveysPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [pollAnalytics, setPollAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPoll, setNewPoll] = useState<Partial<Poll>>({
    title: '',
    description: '',
    type: 'poll',
    targetAudience: 'students',
    questions: []
  })
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    text: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    required: true
  })
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)

  // Question management functions
  const handleQuestionTypeChange = (type: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      type: type as any,
      options: type === 'multiple_choice' || type === 'single_choice' ? ['', '', '', ''] : []
    }))
  }

  const handleAddOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }))
  }

  const handleUpdateOption = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt) || []
    }))
  }

  const handleRemoveOption = (index: number) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }))
  }

  const handleSaveQuestion = () => {
    if (!currentQuestion.text?.trim()) return

    const questionToSave: Question = {
      id: editingQuestionIndex !== null ? newPoll.questions![editingQuestionIndex].id : `q_${Date.now()}`,
      text: currentQuestion.text,
      type: currentQuestion.type!,
      options: currentQuestion.options?.filter(opt => opt.trim()) || [],
      required: currentQuestion.required!
    }

    if (editingQuestionIndex !== null) {
      // Update existing question
      setNewPoll(prev => ({
        ...prev,
        questions: prev.questions?.map((q, i) => i === editingQuestionIndex ? questionToSave : q) || []
      }))
      setEditingQuestionIndex(null)
    } else {
      // Add new question
      setNewPoll(prev => ({
        ...prev,
        questions: [...(prev.questions || []), questionToSave]
      }))
    }

    // Reset current question form
    setCurrentQuestion({
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      required: true
    })
  }

  const handleEditQuestion = (index: number) => {
    const question = newPoll.questions![index]
    setCurrentQuestion({
      text: question.text,
      type: question.type,
      options: question.type === 'multiple_choice' || question.type === 'single_choice' 
        ? [...question.options] 
        : ['', '', '', ''],
      required: question.required
    })
    setEditingQuestionIndex(index)
  }

  const handleDeleteQuestion = (index: number) => {
    setNewPoll(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== index) || []
    }))
  }

  const handleCancelEdit = () => {
    setEditingQuestionIndex(null)
    setCurrentQuestion({
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      required: true
    })
  }

  // Fetch real polls data from API
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true)
        
        // Use cookie-based auth like other working admin APIs
        const response = await fetch('/api/admin/polls', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
          throw new Error(`Failed to fetch polls: ${errorData.details || response.statusText}`)
        }
        
        const data = await response.json()
        console.log('Fetched polls data:', data)
        console.log('Number of polls:', data.polls?.length || 0)
        console.log('Active polls:', data.polls?.filter((p: Poll) => p.status === 'active').length || 0)
        console.log('Full API response:', JSON.stringify(data, null, 2))
        setPolls(data.polls || [])
      } catch (error) {
        console.error('Error fetching polls:', error)
        setPolls([])
      } finally {
        setLoading(false)
      }
    }

    fetchPolls()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'archived': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'poll' ? <Vote className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />
  }

  const getAudienceIcon = (audience: string) => {
    return <Users className="w-4 h-4" />
  }

  const handleCreatePoll = async () => {
    if (!newPoll.title || !newPoll.type || !newPoll.targetAudience) return
    
    try {
      // Use cookie-based auth like other working admin APIs
      const response = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newPoll.title,
          description: newPoll.description || '',
          type: newPoll.type,
          targetAudience: newPoll.targetAudience,
          endDate: newPoll.endDate || null,
          questions: newPoll.questions || []
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Create Poll API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(`Failed to create poll: ${errorData.details || errorData.error || response.statusText}`)
      }

      const data = await response.json()
      
      // Add the new poll to the list
      setPolls([...polls, data.poll])
      setShowCreateModal(false)
      setNewPoll({
        title: '',
        description: '',
        type: 'poll',
        targetAudience: 'students',
        questions: []
      })
    } catch (error) {
      console.error('Error creating poll:', error)
      // You could add a toast notification here
    }
  }

  const handleUpdatePollStatus = async (pollId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/polls/${pollId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update poll status')
      }

      // Update the poll in the local state
      setPolls(polls.map(poll => 
        poll.id === pollId ? { ...poll, status: newStatus as any } : poll
      ))
    } catch (error) {
      console.error('Error updating poll status:', error)
    }
  }

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/polls/${pollId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete poll')
      }

      // Remove the poll from the local state
      setPolls(polls.filter(poll => poll.id !== pollId))
    } catch (error) {
      console.error('Error deleting poll:', error)
    }
  }

  const handleViewPoll = async (poll: Poll) => {
    setSelectedPoll(poll)
    setAnalyticsLoading(true)
    
    try {
      // Fetch analytics for this poll
      const response = await fetch(`/api/admin/polls/analytics?pollId=${poll.id}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPollAnalytics(data.analytics)
      } else {
        console.error('Failed to fetch poll analytics')
        setPollAnalytics(null)
      }
    } catch (error) {
      console.error('Error fetching poll analytics:', error)
      setPollAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }


  const stats = {
    total: polls.length,
    active: polls.filter(p => p.status === 'active').length,
    completed: polls.filter(p => p.status === 'completed').length,
    totalResponses: polls.reduce((sum, poll) => sum + poll.responses, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-gray-200 shadow-sm">
        <div className="px-3 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 md:space-x-4"
            >
              <div className="p-2 md:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg md:rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                  Polls & Surveys
                </h1>
                <p className="text-gray-600 text-xs md:text-sm mt-0.5 md:mt-1 hidden sm:block">Create and manage community feedback</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              <ClientWrapper>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs md:text-sm h-8 md:h-10 px-3 md:px-4 flex-1 md:flex-none"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                  <span className="hidden md:inline">Create Poll/Survey</span>
                  <span className="md:hidden ml-1">Create</span>
                </Button>
              </ClientWrapper>
              <Link href="/admin">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs md:text-sm h-8 md:h-10 px-3 md:px-4">
                  <span className="hidden md:inline">Back</span>
                  <span className="md:hidden">←</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <p className="text-indigo-100 text-[10px] md:text-sm font-medium">Total Polls</p>
                    <p className="text-2xl md:text-3xl font-bold">{stats.total}</p>
                  </div>
                  <BarChart3 className="w-5 h-5 md:w-8 md:h-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <p className="text-green-100 text-[10px] md:text-sm font-medium">Active</p>
                    <p className="text-2xl md:text-3xl font-bold">{stats.active}</p>
                  </div>
                  <Clock className="w-5 h-5 md:w-8 md:h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <p className="text-blue-100 text-[10px] md:text-sm font-medium">Completed</p>
                    <p className="text-2xl md:text-3xl font-bold">{stats.completed}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <p className="text-purple-100 text-[10px] md:text-sm font-medium">Responses</p>
                    <p className="text-2xl md:text-3xl font-bold">{stats.totalResponses}</p>
                  </div>
                  <TrendingUp className="w-5 h-5 md:w-8 md:h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="sticky top-[52px] md:top-[68px] z-30 grid w-full grid-cols-3 bg-gray-50 backdrop-blur-sm border border-gray-200 rounded-lg p-0.5 mb-4">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md py-1.5 md:py-2 text-xs md:text-sm transition-all"
            >
              <span className="md:hidden text-base">📊</span>
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md py-1.5 md:py-2 text-xs md:text-sm transition-all"
            >
              <span className="md:hidden text-base">🔴</span>
              <span className="hidden md:inline">Active Polls</span>
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md py-1.5 md:py-2 text-xs md:text-sm transition-all"
            >
              <span className="md:hidden text-base">📈</span>
              <span className="hidden md:inline">Results</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
              {polls.map((poll, index) => (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-3 md:p-6">
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div className="flex items-center space-x-2 md:space-x-3 flex-1">
                          <div className="p-1.5 md:p-2 bg-indigo-100 rounded-lg">
                            {getTypeIcon(poll.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm md:text-lg truncate">{poll.title}</h3>
                            <p className="text-xs md:text-sm text-gray-600 capitalize">{poll.type}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${getStatusColor(poll.status)} text-[10px] md:text-xs ml-2 whitespace-nowrap`}>
                          {poll.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{poll.description}</p>
                      
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="text-gray-600">Target:</span>
                          <div className="flex items-center space-x-1">
                            {getAudienceIcon(poll.targetAudience)}
                            <span className="capitalize">{poll.targetAudience}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="text-gray-600">Responses:</span>
                          <span className="font-medium">{poll.responses}/{poll.totalTargets}</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                          <div 
                            className="bg-indigo-600 h-1.5 md:h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(poll.responses / poll.totalTargets) * 100}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] md:text-sm text-gray-600">
                          <span className="truncate">Created: {new Date(poll.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="truncate">Ends: {new Date(poll.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-3 md:mt-4">
                        <ClientWrapper>
                          <Button size="sm" variant="outline" onClick={() => handleViewPoll(poll)} className="text-xs h-7 md:h-8 px-2 md:px-3">
                            <Eye className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                            <span className="hidden md:inline">View</span>
                          </Button>
                          {poll.status === 'draft' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdatePollStatus(poll.id, 'active')}
                              className="text-green-600 hover:text-green-700 text-xs h-7 md:h-8 px-2 md:px-3"
                            >
                              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                              <span className="hidden md:inline">Activate</span>
                            </Button>
                          )}
                          {poll.status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdatePollStatus(poll.id, 'completed')}
                              className="text-blue-600 hover:text-blue-700 text-xs h-7 md:h-8 px-2 md:px-3"
                            >
                              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                              <span className="hidden md:inline">Complete</span>
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeletePoll(poll.id)}
                            className="text-red-600 hover:text-red-700 text-xs h-7 md:h-8 px-2 md:px-3"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                            <span className="hidden md:inline">Delete</span>
                          </Button>
                          {poll.status === 'completed' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 md:h-8 px-2 md:px-3">
                              <Download className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                              <span className="hidden md:inline">Export</span>
                            </Button>
                          )}
                        </ClientWrapper>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-3 md:space-y-6">
            {polls.filter(poll => poll.status === 'active').length === 0 ? (
              <div className="text-center py-8 md:py-12 px-4">
                <div className="mx-auto w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Vote className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Active Polls</h3>
                <p className="text-sm md:text-base text-gray-500 mb-4">Create a poll and activate it to see it here.</p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-sm h-9"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Poll
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                {polls.filter(poll => poll.status === 'active').map((poll, index) => (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
                      <CardTitle className="flex items-center space-x-2 text-sm md:text-base">
                        {getTypeIcon(poll.type)}
                        <span className="truncate flex-1">{poll.title}</span>
                        <Badge className="bg-green-100 text-green-800 text-[10px] md:text-xs">Active</Badge>
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm line-clamp-2">{poll.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-2">
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm text-gray-600">Progress</span>
                          <span className="text-xs md:text-sm font-medium">{poll.responses}/{poll.totalTargets} responses</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                          <div 
                            className="bg-green-500 h-2 md:h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(poll.responses / poll.totalTargets) * 100}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs md:text-sm text-gray-600">
                          <span>Ends: {new Date(poll.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>{Math.ceil((new Date(poll.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 flex-1 md:flex-none text-xs h-8">
                            <Share className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                            Share
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 md:flex-none text-xs h-8">
                            <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                            Results
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-3 md:space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Poll & Survey Results</CardTitle>
                <CardDescription className="text-xs md:text-sm">Detailed analytics and insights from completed polls</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="text-center py-8 md:py-12">
                  <PieChart className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
                  <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-2">Results Dashboard</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Advanced analytics and visualization tools for poll results.</p>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-sm h-9">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Poll Detail Modal */}
      {selectedPoll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
          >
            <div className="p-3 md:p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex-1 min-w-0 mr-2">
                <h2 className="text-base md:text-xl font-semibold truncate">{selectedPoll.title}</h2>
                <p className="text-xs md:text-sm text-gray-600 line-clamp-1">{selectedPoll.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPoll(null)
                  setPollAnalytics(null)
                }}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                ✕
              </Button>
            </div>
            
            <div className="p-3 md:p-6">
              {analyticsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading analytics...</p>
                </div>
              ) : pollAnalytics ? (
                <div className="space-y-4 md:space-y-6">
                  {/* Analytics Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    <Card>
                      <CardContent className="p-2 md:p-4 text-center">
                        <p className="text-lg md:text-2xl font-bold text-indigo-600">{pollAnalytics.totalResponses}</p>
                        <p className="text-[10px] md:text-sm text-gray-600">Total Responses</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 md:p-4 text-center">
                        <p className="text-lg md:text-2xl font-bold text-green-600">{pollAnalytics.responseRate}%</p>
                        <p className="text-[10px] md:text-sm text-gray-600">Response Rate</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 md:p-4 text-center">
                        <p className="text-lg md:text-2xl font-bold text-blue-600">{pollAnalytics.totalTargets}</p>
                        <p className="text-[10px] md:text-sm text-gray-600">Target Audience</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 md:p-4 text-center">
                        <Badge variant="outline" className={`${getStatusColor(pollAnalytics.poll?.status || 'draft')} text-[10px] md:text-xs`}>
                          {pollAnalytics.poll?.status || 'Draft'}
                        </Badge>
                        <p className="text-[10px] md:text-sm text-gray-600 mt-1">Status</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Demographics */}
                  {(Object.keys(pollAnalytics.demographics?.byGrade || {}).length > 0 || Object.keys(pollAnalytics.demographics?.byRole || {}).length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                      {Object.keys(pollAnalytics.demographics?.byGrade || {}).length > 0 && (
                        <Card>
                          <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
                            <CardTitle className="text-sm md:text-lg">Responses by Grade</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 md:p-6 pt-0">
                            <div className="space-y-2 md:space-y-3">
                              {Object.entries(pollAnalytics.demographics.byGrade).map(([grade, count]: [string, any]) => (
                                <div key={grade} className="flex items-center justify-between">
                                  <span className="text-xs md:text-sm font-medium">{grade}</span>
                                  <div className="flex items-center space-x-1 md:space-x-2">
                                    <div className="w-16 md:w-24 bg-gray-200 rounded-full h-1.5 md:h-2">
                                      <div 
                                        className="bg-blue-600 h-1.5 md:h-2 rounded-full"
                                        style={{ width: `${((count as number) / pollAnalytics.totalResponses) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs md:text-sm text-gray-600 w-6 md:w-8 text-right">{count as number}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {Object.keys(pollAnalytics.demographics?.byRole || {}).length > 0 && (
                        <Card>
                          <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
                            <CardTitle className="text-sm md:text-lg">Responses by Role</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 md:p-6 pt-0">
                            <div className="space-y-2 md:space-y-3">
                              {Object.entries(pollAnalytics.demographics.byRole).map(([role, count]: [string, any]) => (
                                <div key={role} className="flex items-center justify-between">
                                  <span className="text-xs md:text-sm font-medium capitalize">{role}</span>
                                  <div className="flex items-center space-x-1 md:space-x-2">
                                    <div className="w-16 md:w-24 bg-gray-200 rounded-full h-1.5 md:h-2">
                                      <div 
                                        className="bg-purple-600 h-1.5 md:h-2 rounded-full"
                                        style={{ width: `${((count as number) / pollAnalytics.totalResponses) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs md:text-sm text-gray-600 w-6 md:w-8 text-right">{count as number}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Question Analytics */}
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">Question Results</h3>
                    {pollAnalytics.questionAnalytics?.map((qa: any, index: number) => (
                      <Card key={qa.questionId} className="border-l-2 md:border-l-4 border-l-indigo-500">
                        <CardContent className="p-3 md:p-4">
                          <h4 className="font-medium mb-2 md:mb-3 text-sm md:text-base">{qa.questionText}</h4>
                          <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                            {qa.totalResponses} responses • {qa.questionType}
                          </p>

                          {/* Multiple Choice / Single Choice Options */}
                          {(qa.questionType === 'multiple_choice' || qa.questionType === 'single_choice') && qa.optionDistribution && (
                            <div className="space-y-1.5 md:space-y-2">
                              {Object.entries(qa.optionDistribution).map(([option, count]: [string, any]) => (
                                <div key={option} className="flex items-center justify-between gap-2">
                                  <span className="text-xs md:text-sm truncate flex-1">{option}</span>
                                  <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                                    <div className="w-20 md:w-32 bg-gray-200 rounded-full h-1.5 md:h-2">
                                      <div 
                                        className="bg-indigo-600 h-1.5 md:h-2 rounded-full"
                                        style={{ width: `${qa.totalResponses > 0 ? ((count as number) / qa.totalResponses) * 100 : 0}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs md:text-sm text-gray-600 w-6 md:w-8 text-right">{count as number}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Rating Analytics */}
                          {qa.questionType === 'rating' && qa.ratingStats && (
                            <div className="grid grid-cols-2 gap-2 md:gap-4">
                              <div className="text-center">
                                <p className="text-xl md:text-2xl font-bold text-green-600">{qa.ratingStats.average?.toFixed(1) || 'N/A'}</p>
                                <p className="text-xs md:text-sm text-gray-600">Average Rating</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl md:text-2xl font-bold text-blue-600">{qa.ratingStats.mode || 'N/A'}</p>
                                <p className="text-xs md:text-sm text-gray-600">Most Common</p>
                              </div>
                            </div>
                          )}

                          {/* Yes/No Analytics */}
                          {qa.questionType === 'yes_no' && qa.yesNoDistribution && (
                            <div className="grid grid-cols-2 gap-2 md:gap-4">
                              <div className="text-center">
                                <p className="text-xl md:text-2xl font-bold text-green-600">{qa.yesNoDistribution.yes || 0}</p>
                                <p className="text-xs md:text-sm text-gray-600">Yes</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl md:text-2xl font-bold text-red-600">{qa.yesNoDistribution.no || 0}</p>
                                <p className="text-xs md:text-sm text-gray-600">No</p>
                              </div>
                            </div>
                          )}

                          {/* Text Responses */}
                          {qa.questionType === 'text' && qa.textResponses && qa.textResponses.length > 0 && (
                            <div className="space-y-1.5 md:space-y-2">
                              <h5 className="font-medium text-xs md:text-sm">Recent Responses:</h5>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {qa.textResponses.slice(0, 5).map((response: string, idx: number) => (
                                  <div key={idx} className="text-xs md:text-sm bg-gray-50 p-2 rounded">
                                    "{response}"
                                  </div>
                                ))}
                                {qa.textResponses.length > 5 && (
                                  <p className="text-[10px] md:text-xs text-gray-500">
                                    +{qa.textResponses.length - 5} more responses
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No analytics data available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
          >
            <div className="p-3 md:p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-base md:text-xl font-semibold">Create New Poll/Survey</h2>
              <p className="text-xs md:text-sm text-gray-600">Set up a new poll or survey for your community</p>
            </div>
            
            <div className="p-3 md:p-6 space-y-4 md:space-y-6">
              {/* Basic Poll Information */}
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Title</label>
                  <Input
                    placeholder="Enter poll/survey title"
                    value={newPoll.title}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Description</label>
                  <Textarea
                    placeholder="Describe the purpose of this poll/survey"
                    value={newPoll.description}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Type</label>
                    <Select 
                      value={newPoll.type} 
                      onValueChange={(value) => setNewPoll(prev => ({ ...prev, type: value as 'poll' | 'survey' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poll">Poll</SelectItem>
                        <SelectItem value="survey">Survey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Target Audience</label>
                    <Select 
                      value={newPoll.targetAudience} 
                      onValueChange={(value) => setNewPoll(prev => ({ ...prev, targetAudience: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="teachers">Teachers</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="border-t pt-3 md:pt-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-sm md:text-lg font-medium text-gray-900">Questions</h3>
                  <Badge variant="outline" className="text-xs">{newPoll.questions?.length || 0} questions</Badge>
                </div>

                {/* Existing Questions */}
                {newPoll.questions && newPoll.questions.length > 0 && (
                  <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                    {newPoll.questions.map((question, index) => (
                      <Card key={index} className="border-l-2 md:border-l-4 border-l-indigo-500">
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 mb-1.5 md:mb-2 text-sm md:text-base">{question.text}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-600">
                                <Badge variant="outline" className="capitalize text-[10px] md:text-xs">{question.type.replace('_', ' ')}</Badge>
                                <span className="text-[10px] md:text-xs">{question.required ? 'Required' : 'Optional'}</span>
                                {question.options.length > 0 && (
                                  <span className="text-[10px] md:text-xs">{question.options.length} options</span>
                                )}
                              </div>
                              {question.options.length > 0 && (
                                <div className="mt-1.5 md:mt-2 flex flex-wrap gap-1">
                                  {question.options.slice(0, 3).map((option, optIndex) => (
                                    <Badge key={optIndex} variant="secondary" className="text-[10px] md:text-xs">
                                      {option}
                                    </Badge>
                                  ))}
                                  {question.options.length > 3 && (
                                    <Badge variant="secondary" className="text-[10px] md:text-xs">
                                      +{question.options.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditQuestion(index)}
                                className="h-7 w-7 md:h-8 md:w-8 p-0"
                              >
                                <Edit className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteQuestion(index)}
                                className="text-red-600 hover:text-red-700 h-7 w-7 md:h-8 md:w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add/Edit Question Form */}
                <Card className="bg-gray-50">
                  <CardContent className="p-3 md:p-4">
                    <h4 className="font-medium text-gray-900 mb-3 md:mb-4 text-sm md:text-base">
                      {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
                    </h4>
                    
                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Question Text</label>
                        <Input
                          placeholder="Enter your question"
                          value={currentQuestion.text}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Question Type</label>
                          <Select 
                            value={currentQuestion.type} 
                            onValueChange={(value) => handleQuestionTypeChange(value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="single_choice">Single Choice</SelectItem>
                              <SelectItem value="text">Text Response</SelectItem>
                              <SelectItem value="rating">Rating Scale</SelectItem>
                              <SelectItem value="yes_no">Yes/No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="required"
                            checked={currentQuestion.required}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, required: e.target.checked }))}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="required" className="text-sm font-medium text-gray-700">
                            Required Question
                          </label>
                        </div>
                      </div>

                      {/* Options for Multiple/Single Choice */}
                      {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'single_choice') && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">Answer Options</label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleAddOption}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {currentQuestion.options?.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                                <Input
                                  placeholder={`Option ${index + 1}`}
                                  value={option}
                                  onChange={(e) => handleUpdateOption(index, e.target.value)}
                                  className="flex-1"
                                />
                                {(currentQuestion.options?.length || 0) > 2 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveOption(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {(currentQuestion.options?.length || 0) < 4 && (
                            <p className="text-sm text-amber-600 mt-2">
                              ⚠️ Add at least 4 options for better poll engagement
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-3 pt-4">
                        <Button
                          onClick={handleSaveQuestion}
                          disabled={!currentQuestion.text?.trim() || (currentQuestion.type === 'multiple_choice' && (currentQuestion.options?.filter(o => o.trim()).length || 0) < 2)}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                        </Button>
                        {editingQuestionIndex !== null && (
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="p-3 md:p-6 border-t flex flex-col-reverse md:flex-row items-stretch md:items-center justify-end gap-2 md:gap-3 sticky bottom-0 bg-white">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewPoll({
                    title: '',
                    description: '',
                    type: 'poll',
                    targetAudience: 'students',
                    questions: []
                  })
                  setCurrentQuestion({
                    text: '',
                    type: 'multiple_choice',
                    options: ['', '', '', ''],
                    required: true
                  })
                  setEditingQuestionIndex(null)
                }}
                className="text-sm h-9 md:h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePoll}
                disabled={!newPoll.title?.trim() || !newPoll.questions?.length}
                className="bg-indigo-600 hover:bg-indigo-700 text-sm h-9 md:h-10"
              >
                <span className="hidden md:inline">Create Poll/Survey ({newPoll.questions?.length || 0} questions)</span>
                <span className="md:hidden">Create ({newPoll.questions?.length || 0} questions)</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
