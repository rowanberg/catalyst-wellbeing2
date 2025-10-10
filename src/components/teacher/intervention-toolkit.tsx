'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Heart, 
  Activity, 
  Users, 
  Clock, 
  Star, 
  Play, 
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Target,
  Timer,
  BookOpen,
  Smile,
  Zap,
  RefreshCw
} from 'lucide-react'

interface InterventionActivity {
  id: string
  title: string
  description: string
  category: 'mindfulness' | 'movement' | 'social' | 'academic' | 'emotional'
  duration: number // in minutes
  difficulty: 'easy' | 'medium' | 'hard'
  targetMoods: string[]
  materials: string[]
  instructions: string[]
  benefits: string[]
  ageGroups: string[]
  classSize: 'individual' | 'small_group' | 'whole_class'
  effectiveness: number // 1-5 rating
}

interface ClassAnalytics {
  averageWellbeing: number
  riskLevel: 'low' | 'medium' | 'high'
  dominantMoods: string[]
  stressIndicators: string[]
  timeOfDay: string
  recentActivities: string[]
}

interface Suggestion {
  activity: InterventionActivity
  relevanceScore: number
  reasoning: string
  urgency: 'low' | 'medium' | 'high'
}

export default function InterventionToolkit() {
  const [activities, setActivities] = useState<InterventionActivity[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedActivity, setSelectedActivity] = useState<InterventionActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [implementing, setImplementing] = useState<string | null>(null)

  useEffect(() => {
    fetchClassAnalytics()
    fetchActivities()
  }, [])

  useEffect(() => {
    if (classAnalytics && activities.length > 0) {
      generateSuggestions()
    }
  }, [classAnalytics, activities])

  const fetchClassAnalytics = async () => {
    try {
      const response = await fetch('/api/teacher/intervention-analytics')
      if (response.ok) {
        const data = await response.json()
        setClassAnalytics(data.analytics)
      }
    } catch (error: any) {
      console.error('Error fetching class analytics:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/teacher/intervention-activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSuggestions = () => {
    if (!classAnalytics) return

    const scored = activities.map(activity => {
      let score = 0
      let reasoning: string[] = []

      // Risk level matching
      if (classAnalytics.riskLevel === 'high' && activity.category === 'emotional') {
        score += 30
        reasoning.push('High stress levels detected - emotional support needed')
      } else if (classAnalytics.riskLevel === 'medium' && activity.category === 'mindfulness') {
        score += 25
        reasoning.push('Moderate stress - mindfulness activities recommended')
      }

      // Mood matching
      const moodMatch = activity.targetMoods.some(mood => 
        classAnalytics.dominantMoods.includes(mood)
      )
      if (moodMatch) {
        score += 20
        reasoning.push('Targets current dominant class moods')
      }

      // Time of day appropriateness
      const currentHour = new Date().getHours()
      if (currentHour < 10 && activity.category === 'movement') {
        score += 15
        reasoning.push('Morning energy boost activity')
      } else if (currentHour > 14 && activity.category === 'mindfulness') {
        score += 15
        reasoning.push('Afternoon focus restoration')
      }

      // Avoid recently used activities
      if (classAnalytics.recentActivities.includes(activity.id)) {
        score -= 10
        reasoning.push('Recently used - consider alternatives')
      }

      // Effectiveness bonus
      score += activity.effectiveness * 5

      // Duration appropriateness
      if (activity.duration <= 10) {
        score += 10
        reasoning.push('Quick implementation possible')
      }

      const urgency: 'high' | 'medium' | 'low' = classAnalytics.riskLevel === 'high' ? 'high' : 
                     classAnalytics.riskLevel === 'medium' ? 'medium' : 'low'

      return {
        activity,
        relevanceScore: score,
        reasoning: reasoning.join(', '),
        urgency
      }
    })

    const sorted = scored
      .filter(s => s.relevanceScore > 10)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6)

    setSuggestions(sorted)
  }

  const implementActivity = async (activityId: string) => {
    setImplementing(activityId)
    try {
      const response = await fetch('/api/teacher/implement-intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId })
      })

      if (response.ok) {
        // Refresh analytics after implementation
        setTimeout(() => {
          fetchClassAnalytics()
          setImplementing(null)
        }, 2000)
      }
    } catch (error: any) {
      console.error('Error implementing activity:', error)
      setImplementing(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mindfulness': return <Brain className="h-5 w-5" />
      case 'movement': return <Activity className="h-5 w-5" />
      case 'social': return <Users className="h-5 w-5" />
      case 'academic': return <BookOpen className="h-5 w-5" />
      case 'emotional': return <Heart className="h-5 w-5" />
      default: return <Lightbulb className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mindfulness': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'movement': return 'bg-green-100 text-green-700 border-green-200'
      case 'social': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'academic': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'emotional': return 'bg-pink-100 text-pink-700 border-pink-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Intervention Toolkit</h1>
        <p className="text-gray-600">AI-powered activity suggestions based on real-time class wellbeing data</p>
      </div>

      {/* Class Analytics Overview */}
      {classAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Current Class Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                classAnalytics.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                classAnalytics.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {classAnalytics.riskLevel === 'high' && <AlertTriangle className="h-4 w-4 mr-1" />}
                {classAnalytics.riskLevel.toUpperCase()} RISK
              </div>
              <p className="text-xs text-gray-500 mt-1">Stress Level</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {classAnalytics.averageWellbeing.toFixed(1)}
              </div>
              <p className="text-xs text-gray-500">Wellbeing Score</p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center space-x-1">
                {classAnalytics.dominantMoods.slice(0, 3).map((mood, index) => (
                  <span key={index} className="text-lg">{mood}</span>
                ))}
              </div>
              <p className="text-xs text-gray-500">Dominant Moods</p>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => fetchClassAnalytics()}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
              <p className="text-xs text-gray-500 mt-1">Update Data</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-500" />
          AI-Powered Suggestions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(suggestion.activity.category)}`}>
                    {getCategoryIcon(suggestion.activity.category)}
                    <span className="ml-1">{suggestion.activity.category}</span>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(suggestion.urgency)}`}>
                    {suggestion.urgency}
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{suggestion.activity.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{suggestion.activity.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span className="flex items-center">
                    <Timer className="h-3 w-3 mr-1" />
                    {suggestion.activity.duration}min
                  </span>
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    {suggestion.relevanceScore}% match
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 mb-3 italic">"{suggestion.reasoning}"</p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedActivity(suggestion.activity)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => implementActivity(suggestion.activity.id)}
                    disabled={implementing === suggestion.activity.id}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {implementing === suggestion.activity.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Implement
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {suggestions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No specific interventions needed right now</p>
            <p className="text-xs">Your class wellbeing looks good!</p>
          </div>
        )}
      </div>

      {/* Activity Library */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-green-600" />
          Activity Library
        </h2>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'mindfulness', 'movement', 'social', 'academic', 'emotional'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities
            .filter(activity => selectedCategory === 'all' || activity.category === selectedCategory)
            .map(activity => (
              <motion.div
                key={activity.id}
                whileHover={{ scale: 1.02 }}
                className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedActivity(activity)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(activity.category)}`}>
                    {getCategoryIcon(activity.category)}
                    <span className="ml-1">{activity.category}</span>
                  </div>
                  <div className="flex items-center">
                    {Array.from({ length: activity.effectiveness }).map((_: any, i: number) => (
                      <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{activity.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.duration} min
                  </span>
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {activity.classSize.replace('_', ' ')}
                  </span>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedActivity.title}</h2>
                  <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(selectedActivity.category)}`}>
                      {getCategoryIcon(selectedActivity.category)}
                      <span className="ml-1">{selectedActivity.category}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {selectedActivity.duration} minutes • {selectedActivity.difficulty}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-700 mb-4">{selectedActivity.description}</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedActivity.instructions.map((instruction, index) => (
                      <li key={index} className="text-sm text-gray-700">{instruction}</li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Materials Needed</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedActivity.materials.map((material, index) => (
                      <li key={index} className="text-sm text-gray-700">{material}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Benefits</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedActivity.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-gray-700">{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    implementActivity(selectedActivity.id)
                    setSelectedActivity(null)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Implement Activity
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
