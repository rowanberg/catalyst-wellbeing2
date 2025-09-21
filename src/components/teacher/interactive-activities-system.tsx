'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Zap, 
  Users, 
  Heart, 
  Palette, 
  BookOpen,
  Play,
  Clock,
  Star,
  Trophy,
  Target,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Timer,
  User,
  BarChart3,
  Lightbulb,
  Settings,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface ActivityTemplate {
  id: string
  name: string
  description: string
  instructions: string
  duration_minutes: number
  materials_needed: string[]
  age_group: string
  mood_targets: string[]
  difficulty_level: 'easy' | 'medium' | 'hard'
  group_size: string
  benefits: string[]
  variations: string[]
  safety_notes?: string
  usage_count: number
  rating: number
  category: {
    id: string
    name: string
    icon: string
    color: string
  }
}

interface ActivitySession {
  id: string
  activity_type: 'template' | 'custom'
  activity_id: string
  session_name: string
  conducted_at: string
  duration_actual_minutes: number
  participant_count: number
  effectiveness_rating: number
  mood_before: any
  mood_after: any
  session_notes: string
  follow_up_needed: boolean
  class: {
    id: string
    name: string
  }
  participants: Array<{
    student: {
      id: string
      full_name: string
    }
    participation_level: string
    engagement_score: number
    mood_before: string
    mood_after: string
  }>
}

const categoryIcons = {
  'Mindfulness': Brain,
  'Physical': Zap,
  'Social': Users,
  'Emotional': Heart,
  'Creative': Palette,
  'Academic': BookOpen
}

export default function InteractiveActivitiesSystem() {
  const [activeTab, setActiveTab] = useState<'browse' | 'sessions' | 'analytics'>('browse')
  const [templates, setTemplates] = useState<ActivityTemplate[]>([])
  const [sessions, setSessions] = useState<ActivitySession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<ActivityTemplate | null>(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterMood, setFilterMood] = useState('')
  const [filterDuration, setFilterDuration] = useState(30)

  // Session form
  const [sessionForm, setSessionForm] = useState({
    class_id: '',
    session_name: '',
    duration_actual_minutes: 0,
    participant_count: 0,
    effectiveness_rating: 5,
    session_notes: '',
    mood_before: {},
    mood_after: {},
    follow_up_needed: false,
    participants: []
  })

  useEffect(() => {
    fetchTemplates()
    if (activeTab === 'sessions') {
      fetchSessions()
    }
  }, [activeTab])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        duration: filterDuration.toString(),
        ...(filterCategory && { category: filterCategory }),
        ...(filterMood && { mood: filterMood })
      })

      const response = await fetch(`/api/teacher/activities/templates?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/teacher/activities/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const startActivity = (template: ActivityTemplate) => {
    setSelectedActivity(template)
    setSessionForm({
      ...sessionForm,
      session_name: `${template.name} Session`,
      duration_actual_minutes: template.duration_minutes
    })
    setShowSessionModal(true)
  }

  const recordSession = async () => {
    if (!selectedActivity) return

    try {
      const response = await fetch('/api/teacher/activities/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sessionForm,
          activity_type: 'template',
          activity_id: selectedActivity.id
        })
      })

      if (response.ok) {
        setShowSessionModal(false)
        setSelectedActivity(null)
        setSessionForm({
          class_id: '',
          session_name: '',
          duration_actual_minutes: 0,
          participant_count: 0,
          effectiveness_rating: 5,
          session_notes: '',
          mood_before: {},
          mood_after: {},
          follow_up_needed: false,
          participants: []
        })
        if (activeTab === 'sessions') {
          fetchSessions()
        }
      }
    } catch (error) {
      console.error('Error recording session:', error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getParticipationColor = (level: string) => {
    switch (level) {
      case 'enthusiastic': return 'bg-green-100 text-green-700'
      case 'full': return 'bg-blue-100 text-blue-700'
      case 'partial': return 'bg-yellow-100 text-yellow-700'
      case 'minimal': return 'bg-orange-100 text-orange-700'
      case 'none': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl text-white">
                <Lightbulb className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Interactive Activities</h1>
                <p className="text-lg text-gray-600">Evidence-based activities to support student well-being and engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-3 mb-8">
        {[
          { id: 'browse', label: 'Browse Activities', icon: Search, count: templates.length },
          { id: 'sessions', label: 'Session History', icon: BarChart3, count: sessions.length },
          { id: 'analytics', label: 'Analytics', icon: Target, count: 0 }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tab.count}
                </Badge>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Filters for Browse Tab */}
      {activeTab === 'browse' && (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Activities</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Mindfulness">Mindfulness</option>
                <option value="Physical">Physical</option>
                <option value="Social">Social</option>
                <option value="Emotional">Emotional</option>
                <option value="Creative">Creative</option>
                <option value="Academic">Academic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Mood</label>
              <select
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Mood</option>
                <option value="anxious">Anxious</option>
                <option value="sad">Sad</option>
                <option value="angry">Angry</option>
                <option value="restless">Restless</option>
                <option value="overwhelmed">Overwhelmed</option>
                <option value="low_energy">Low Energy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Duration (minutes)</label>
              <Input
                type="number"
                value={filterDuration}
                onChange={(e) => setFilterDuration(parseInt(e.target.value) || 30)}
                min="5"
                max="60"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchTemplates} className="bg-gradient-to-r from-green-600 to-blue-600">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Activities Found</h3>
                <p className="text-sm">Try adjusting your filters to find more activities</p>
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const CategoryIcon = categoryIcons[template.category.name as keyof typeof categoryIcons] || BookOpen
                return (
                  <motion.div
                    key={template.id}
                    className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.03, y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${template.category.color} text-white`}>
                        <CategoryIcon className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getDifficultyColor(template.difficulty_level)}>
                          {template.difficulty_level}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {template.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {template.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {template.group_size}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          {template.usage_count} uses
                        </span>
                      </div>

                      {template.mood_targets.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Helps with:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.mood_targets.slice(0, 3).map((mood) => (
                              <Badge key={mood} variant="outline" className="text-xs">
                                {mood.replace('_', ' ')}
                              </Badge>
                            ))}
                            {template.mood_targets.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.mood_targets.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => startActivity(template)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Activity
                      </Button>
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Sessions Yet</h3>
                <p className="text-sm">Start conducting activities to see your session history</p>
              </div>
            ) : (
              sessions.map((session) => (
                <motion.div
                  key={session.id}
                  className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{session.session_name}</h3>
                        <Badge variant="outline">{session.class.name}</Badge>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < session.effectiveness_rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(session.conducted_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          {session.duration_actual_minutes} minutes
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {session.participant_count} participants
                        </span>
                      </div>

                      {session.session_notes && (
                        <p className="text-gray-700 mb-3">{session.session_notes}</p>
                      )}

                      {session.participants.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {session.participants.slice(0, 4).map((participant, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{participant.student.full_name}</span>
                                <Badge className={getParticipationColor(participant.participation_level)}>
                                  {participant.participation_level}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>Engagement: {participant.engagement_score}/5</span>
                                {participant.mood_before && participant.mood_after && (
                                  <span>{participant.mood_before} → {participant.mood_after}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {session.participants.length > 4 && (
                            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
                              <span className="text-sm text-gray-600">
                                +{session.participants.length - 4} more participants
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {session.follow_up_needed && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Follow-up needed</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Activity Analytics</h3>
            <p className="text-sm mb-6">Track the effectiveness of your interventions and student engagement</p>
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Detailed Analytics
            </Button>
          </div>
        )}
      </div>

      {/* Session Recording Modal */}
      <AnimatePresence>
        {showSessionModal && selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowSessionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Record Activity Session</h2>
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedActivity.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{selectedActivity.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Duration: {selectedActivity.duration_minutes} min</span>
                  <span>Difficulty: {selectedActivity.difficulty_level}</span>
                  <span>Group: {selectedActivity.group_size}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      value={sessionForm.class_id}
                      onChange={(e) => setSessionForm({ ...sessionForm, class_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Class</option>
                      {/* Add class options */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
                    <Input
                      value={sessionForm.session_name}
                      onChange={(e) => setSessionForm({ ...sessionForm, session_name: e.target.value })}
                      placeholder="Session name..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Duration (min)</label>
                    <Input
                      type="number"
                      value={sessionForm.duration_actual_minutes}
                      onChange={(e) => setSessionForm({ ...sessionForm, duration_actual_minutes: parseInt(e.target.value) || 0 })}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
                    <Input
                      type="number"
                      value={sessionForm.participant_count}
                      onChange={(e) => setSessionForm({ ...sessionForm, participant_count: parseInt(e.target.value) || 0 })}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effectiveness (1-5)</label>
                    <Input
                      type="number"
                      value={sessionForm.effectiveness_rating}
                      onChange={(e) => setSessionForm({ ...sessionForm, effectiveness_rating: parseInt(e.target.value) || 5 })}
                      min="1"
                      max="5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Notes</label>
                  <Textarea
                    value={sessionForm.session_notes}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_notes: e.target.value })}
                    rows={3}
                    placeholder="How did the activity go? Any observations or adjustments made?"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="follow_up"
                    checked={sessionForm.follow_up_needed}
                    onChange={(e) => setSessionForm({ ...sessionForm, follow_up_needed: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="follow_up" className="text-sm text-gray-700">
                    Follow-up needed with specific students
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowSessionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={recordSession}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Record Session
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
