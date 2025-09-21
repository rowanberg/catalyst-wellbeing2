'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Bell, BarChart3, Calendar, AlertCircle, Users, Clock, X, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'general' | 'academic' | 'event' | 'urgent'
  priority: 'low' | 'medium' | 'high'
  author: string
  created_at: string
}

interface Poll {
  id: string
  title: string
  description: string
  questions: any[]
  endDate?: string
  hasResponded: boolean
  allowMultipleResponses?: boolean
  type?: string
}

export default function StudentAnnouncementsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'announcements' | 'polls'>('announcements')
  
  // Poll modal state
  const [showPollModal, setShowPollModal] = useState(false)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [pollResponses, setPollResponses] = useState<{[key: string]: any}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [announcementsResponse, pollsResponse] = await Promise.all([
        fetch('/api/student/announcements'),
        fetch('/api/polls')
      ])
      
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json()
        setAnnouncements(announcementsData)
      }
      
      if (pollsResponse.ok) {
        const pollsData = await pollsResponse.json()
        // The API returns { polls: [...] } so we need to extract the polls array
        setPolls(pollsData.polls || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'urgent': return '🚨'
      case 'academic': return '📚'
      case 'event': return '🎉'
      case 'general': return '📢'
      default: return '📢'
    }
  }

  // Handle poll response
  const handlePollResponse = (poll: Poll) => {
    setSelectedPoll(poll)
    setShowPollModal(true)
    setPollResponses({}) // Reset responses
  }

  // Submit poll response
  const submitPollResponse = async () => {
    if (!selectedPoll || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Validate required questions
      const requiredQuestions = selectedPoll.questions.filter(q => q.required)
      const missingResponses = requiredQuestions.filter(q => !pollResponses[q.id])
      
      if (missingResponses.length > 0) {
        addToast({
          title: "Missing Responses",
          description: "Please answer all required questions before submitting.",
          type: "error"
        })
        setIsSubmitting(false)
        return
      }

      // Convert responses to the format expected by the API
      const answers = Object.entries(pollResponses).map(([questionId, value]) => ({
        questionId,
        value
      }))

      const response = await fetch('/api/polls/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId: selectedPoll.id,
          answers: answers
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        addToast({
          title: "Response Submitted!",
          description: "Thank you for participating in the poll.",
          type: "success"
        })
        
        // Update poll status
        setPolls(prev => prev.map(poll => 
          poll.id === selectedPoll.id 
            ? { ...poll, hasResponded: true }
            : poll
        ))
        
        setShowPollModal(false)
        setSelectedPoll(null)
        setPollResponses({})
      } else {
        addToast({
          title: "Submission Failed",
          description: responseData.error || "Failed to submit your response. Please try again.",
          type: "error"
        })
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to submit your response. Please try again.",
        type: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-Optimized Header */}
      <div className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-10">
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button 
                onClick={() => router.push('/student')} 
                variant="ghost" 
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-white/50 rounded-full transition-all duration-200 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                  School Updates
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Stay connected with your school</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-xs text-gray-500 bg-white/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/40">
                {activeTab === 'announcements' ? announcements.length : polls.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-4xl mx-auto">
        {/* Mobile-Optimized Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-xl border border-white/30">
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <Button
                onClick={() => setActiveTab('announcements')}
                variant="ghost"
                className={`relative h-12 sm:h-14 lg:h-16 rounded-lg sm:rounded-xl transition-all duration-300 ${
                  activeTab === 'announcements'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5 sm:gap-1 lg:gap-2">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                  <span className="text-xs sm:text-sm font-medium leading-tight">Announcements</span>
                  {announcements.length > 0 && (
                    <div className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === 'announcements' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {announcements.length}
                    </div>
                  )}
                </div>
              </Button>
              
              <Button
                onClick={() => setActiveTab('polls')}
                variant="ghost"
                className={`relative h-12 sm:h-14 lg:h-16 rounded-lg sm:rounded-xl transition-all duration-300 ${
                  activeTab === 'polls'
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5 sm:gap-1 lg:gap-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                  <span className="text-xs sm:text-sm font-medium leading-tight">Polls</span>
                  {polls.length > 0 && (
                    <div className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === 'polls' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {polls.length}
                    </div>
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-3 sm:mb-4"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 sm:h-12 sm:w-12 border-2 border-purple-300 mx-auto opacity-30"></div>
            </div>
            <p className="text-gray-600 font-medium text-sm sm:text-base">Loading updates...</p>
          </div>
        ) : (
          <>
            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
              <div className="space-y-3 sm:space-y-4">
                {announcements.length === 0 ? (
                  <Card className="bg-white/90 backdrop-blur-xl border-white/30 shadow-xl">
                    <CardContent className="text-center py-12 sm:py-16">
                      <div className="mb-4 sm:mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Bell className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500" />
                        </div>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Announcements</h3>
                      <p className="text-gray-600 text-sm sm:text-base">Check back later for important school updates and news.</p>
                    </CardContent>
                  </Card>
                ) : (
                  announcements.map((announcement) => (
                    <Card key={announcement.id} className="bg-white/90 backdrop-blur-xl border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02]">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="text-xl sm:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">
                            {getTypeEmoji(announcement.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                              <h3 className="font-bold text-gray-900 text-sm sm:text-lg leading-tight">
                                {announcement.title}
                              </h3>
                              {announcement.priority === 'high' && (
                                <div className="flex items-center gap-1 bg-red-50 text-red-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium flex-shrink-0">
                                  <AlertCircle className="h-3 w-3" />
                                  <span className="hidden sm:inline">Urgent</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 mb-3 sm:mb-4">
                              <Badge className={`${getPriorityColor(announcement.priority)} font-medium text-xs`}>
                                {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                                <span className="hidden sm:inline"> Priority</span>
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                              {announcement.content}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-500 pt-2 sm:pt-3 border-t border-gray-200/50">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="font-medium truncate">{announcement.author}</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">{new Date(announcement.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Polls Tab */}
            {activeTab === 'polls' && (
              <div className="space-y-3 sm:space-y-4">
                {polls.length === 0 ? (
                  <Card className="bg-white/90 backdrop-blur-xl border-white/30 shadow-xl">
                    <CardContent className="text-center py-12 sm:py-16">
                      <div className="mb-4 sm:mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
                        </div>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Active Polls</h3>
                      <p className="text-gray-600 text-sm sm:text-base">No polls are currently available. Check back later to share your opinions!</p>
                    </CardContent>
                  </Card>
                ) : (
                  polls.map((poll) => (
                    <Card key={poll.id} className="bg-white/90 backdrop-blur-xl border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02]">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="text-xl sm:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">
                            📊
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                              <h3 className="font-bold text-gray-900 text-sm sm:text-lg leading-tight">
                                {poll.title}
                              </h3>
                              <Badge className={`${poll.hasResponded ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'} font-medium text-xs flex-shrink-0`}>
                                {poll.hasResponded ? 'Done' : 'New'}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                              {poll.description}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                              <div className="flex items-center gap-2 sm:gap-4">
                                <span>{poll.questions?.length || 0} question{(poll.questions?.length || 0) !== 1 ? 's' : ''}</span>
                                {poll.endDate && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="text-xs sm:text-sm">Ends {new Date(poll.endDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {!poll.hasResponded && (
                              <Button 
                                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium text-sm"
                                onClick={() => handlePollResponse(poll)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                                    Loading...
                                  </>
                                ) : (
                                  'Participate in Poll'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Poll Response Modal */}
      {showPollModal && selectedPoll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPoll.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedPoll.description}</p>
                </div>
                <Button
                  onClick={() => {
                    setShowPollModal(false)
                    setSelectedPoll(null)
                    setPollResponses({})
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span>{selectedPoll.questions?.length || 0} question{(selectedPoll.questions?.length || 0) !== 1 ? 's' : ''}</span>
                {selectedPoll.endDate && (
                  <span>Ends {new Date(selectedPoll.endDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedPoll.questions?.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-500 mt-1">{index + 1}.</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{question.text}</h4>
                      {question.required && (
                        <span className="text-xs text-red-500">* Required</span>
                      )}
                    </div>
                  </div>

                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2 ml-6">
                      {question.options?.map((option: string, optionIndex: number) => (
                        <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={pollResponses[question.id] === option}
                            onChange={(e) => setPollResponses(prev => ({
                              ...prev,
                              [question.id]: e.target.value
                            }))}
                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'text' && (
                    <div className="ml-6">
                      <textarea
                        value={pollResponses[question.id] || ''}
                        onChange={(e) => setPollResponses(prev => ({
                          ...prev,
                          [question.id]: e.target.value
                        }))}
                        placeholder="Enter your response..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                  )}

                  {question.type === 'rating' && (
                    <div className="ml-6">
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setPollResponses(prev => ({
                              ...prev,
                              [question.id]: rating
                            }))}
                            className={`w-10 h-10 rounded-full border-2 font-medium text-sm transition-all ${
                              pollResponses[question.id] === rating
                                ? 'bg-purple-500 text-white border-purple-500'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {Object.keys(pollResponses).length} of {selectedPoll.questions?.length || 0} questions answered
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setShowPollModal(false)
                      setSelectedPoll(null)
                      setPollResponses({})
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitPollResponse}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Response
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
