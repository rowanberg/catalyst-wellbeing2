'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NextImage from 'next/image'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  AlertTriangle, Heart, Brain, Users, TrendingUp, TrendingDown,
  Search, Filter, Download, ArrowLeft, RefreshCw, Eye,
  Target, Activity, Zap, Clock, CheckCircle, AlertCircle,
  User, Calendar, BarChart3, Award, Shield, BookOpen,
  Sparkles, Cpu, Layers, Globe, Network, Scan, Radar,
  Bot, Lightbulb, Waves, Binary, Code, Atom, Orbit,
  Palette, Flame, Star, Hexagon, Diamond, Triangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Future: Add advanced visualization components when needed
// const AdvancedChart = dynamic(() => import('@/components/charts/AdvancedChart'), { ssr: false })
// const NeuralNetwork = dynamic(() => import('@/components/visualizations/NeuralNetwork'), { ssr: false })

interface WellbeingAnalytic {
  id: string
  student_id: string
  student_name: string
  student_grade: string
  student_class: string
  student_avatar?: string
  analysis_date: string
  period_type: string
  overall_wellbeing_score: number
  emotional_wellbeing_score: number
  academic_wellbeing_score: number
  engagement_wellbeing_score: number
  social_wellbeing_score: number
  behavioral_wellbeing_score: number
  risk_level: 'thriving' | 'low' | 'medium' | 'high' | 'critical'
  risk_score: number
  risk_trend: 'increasing' | 'stable' | 'decreasing'
  risk_factors: string[]
  protective_factors: string[]
  risk_factor_count: number
  protective_factor_count: number
  intervention_recommended: boolean
  intervention_type?: string
  intervention_priority?: 'immediate' | 'urgent' | 'moderate' | 'low'
  recommended_actions: string[]
  early_warning_flags: string[]
  warning_flag_count: number
  predicted_next_score: number
  predicted_risk_level: string
  confidence_level: number
  overall_score_trend: 'improving' | 'stable' | 'declining'
  score_change_from_previous: number
  school_percentile: number
  grade_percentile: number
  mood_score_avg: number
  gpa: number
  attendance_rate: number
  quest_completion_rate: number
  xp_earned: number
  incident_count: number
  help_requests_count: number
  urgent_help_requests_count: number
  data_quality_score: number
  data_completeness_percentage: number
}

interface SummaryStats {
  total: number
  by_risk_level: Record<string, number>
  by_intervention_priority: Record<string, number>
  average_scores: Record<string, number>
  interventions_needed: number
  high_risk_count: number
  improving_trend: number
  declining_trend: number
}

export default function WellbeingSeverityPage() {
  // Core State
  const [analytics, setAnalytics] = useState<WellbeingAnalytic[]>([])
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [periodType, setPeriodType] = useState('weekly')
  const [riskLevelFilter, setRiskLevelFilter] = useState('all')
  const [sortBy, setSortBy] = useState('risk_score')
  const [sortOrder, setSortOrder] = useState('desc')

  // UI State
  const [selectedStudent, setSelectedStudent] = useState<WellbeingAnalytic | null>(null)
  const [showInterventionModal, setShowInterventionModal] = useState(false)
  const [interventionStudent, setInterventionStudent] = useState<WellbeingAnalytic | null>(null)
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([])
  const [interventionNotes, setInterventionNotes] = useState('')
  const [interventionPriority, setInterventionPriority] = useState<'urgent' | 'high' | 'medium'>('high')
  const [interventionLoading, setInterventionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('neural')
  const [showFilters, setShowFilters] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)

  // Advanced Features
  const [viewMode, setViewMode] = useState<'grid' | 'neural' | 'heatmap' | 'predictive'>('neural')
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [neuralConnections, setNeuralConnections] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[][]>([])
  const [realTimeUpdates, setRealTimeUpdates] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [neonMode, setNeonMode] = useState(false)
  const [particleSystem, setParticleSystem] = useState(true)

  // Responsive
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')

  // Refs for advanced animations
  // Scroll animations
  // Spring animations

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        period_type: periodType,
        risk_level: riskLevelFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      })

      const response = await fetch(`/api/admin/wellbeing-severity?${params}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch analytics')
      }

      const data = await response.json()

      // Ensure data structure
      const analyticsData = Array.isArray(data.analytics) ? data.analytics : []
      const summaryData = data.summary || {
        total: analyticsData.length,
        high_risk_count: analyticsData.filter((a: WellbeingAnalytic) => a.risk_level === 'high' || a.risk_level === 'critical').length,
        interventions_needed: analyticsData.filter((a: WellbeingAnalytic) => a.intervention_recommended).length,
        improving_trend: analyticsData.filter((a: WellbeingAnalytic) => a.overall_score_trend === 'improving').length,
        declining_trend: analyticsData.filter((a: WellbeingAnalytic) => a.overall_score_trend === 'declining').length,
        average_scores: {
          overall: analyticsData.reduce((sum: number, a: WellbeingAnalytic) => sum + (a.overall_wellbeing_score || 0), 0) / (analyticsData.length || 1)
        },
        by_risk_level: {},
        by_intervention_priority: {}
      }

      setAnalytics(analyticsData)
      setSummary(summaryData)
      setLastFetchTime(new Date())

      if (analyticsData.length > 0) {
        toast.success(`Loaded ${analyticsData.length} student record${analyticsData.length > 1 ? 's' : ''}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load wellbeing analytics'
      console.error('Error fetching wellbeing analytics:', error)
      setError(errorMessage)
      toast.error(errorMessage)
      setAnalytics([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [periodType, riskLevelFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Intervention options
  const interventionOptions = [
    { id: 'counseling', label: 'Schedule Counseling Session', icon: '🗣️', description: 'One-on-one session with school counselor' },
    { id: 'parent_contact', label: 'Contact Parents/Guardians', icon: '👨‍👩‍👧', description: 'Notify and involve family members' },
    { id: 'wellness_plan', label: 'Create Wellness Plan', icon: '📋', description: 'Personalized wellbeing action plan' },
    { id: 'support_teacher', label: 'Assign Support Teacher', icon: '👨‍🏫', description: 'Dedicated teacher for additional support' },
    { id: 'peer_support', label: 'Peer Support Group', icon: '👥', description: 'Connect with peer support network' },
    { id: 'mental_health', label: 'Mental Health Resources', icon: '💚', description: 'Provide mental health materials and contacts' },
    { id: 'academic_support', label: 'Academic Tutoring', icon: '📚', description: 'Additional academic assistance' },
    { id: 'priority_checkin', label: 'Priority Daily Check-in', icon: '✅', description: 'Daily wellbeing monitoring' },
    { id: 'school_counselor', label: 'Refer to School Counselor', icon: '🏥', description: 'Professional counseling referral' },
    { id: 'break_schedule', label: 'Adjusted Schedule', icon: '⏰', description: 'Modified schedule for wellbeing' }
  ]

  // Handle intervention modal
  const openInterventionModal = useCallback((student: WellbeingAnalytic) => {
    console.log('Opening intervention modal for:', student.student_name, 'Risk:', student.risk_level)
    setInterventionStudent(student)
    setShowInterventionModal(true)
    setSelectedInterventions([])
    setInterventionNotes('')
    setInterventionPriority(student.risk_level === 'critical' ? 'urgent' : 'high')
  }, [])

  const closeInterventionModal = useCallback(() => {
    setShowInterventionModal(false)
    setInterventionStudent(null)
    setSelectedInterventions([])
    setInterventionNotes('')
    setInterventionPriority('high')
    setInterventionLoading(false)
  }, [])

  const toggleIntervention = useCallback((interventionId: string) => {
    setSelectedInterventions(prev =>
      prev.includes(interventionId)
        ? prev.filter(id => id !== interventionId)
        : [...prev, interventionId]
    )
  }, [])

  const handleSubmitIntervention = useCallback(async () => {
    if (!interventionStudent || selectedInterventions.length === 0) {
      toast.error('Please select at least one intervention')
      return
    }

    try {
      setInterventionLoading(true)

      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500))

      const interventionData = {
        student_id: interventionStudent.student_id,
        student_name: interventionStudent.student_name,
        interventions: selectedInterventions,
        priority: interventionPriority,
        notes: interventionNotes,
        risk_level: interventionStudent.risk_level,
        risk_score: interventionStudent.risk_score,
        overall_wellbeing_score: interventionStudent.overall_wellbeing_score,
        scheduled_start_date: new Date().toISOString().split('T')[0], // Today
        target_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }

      console.log('Submitting intervention data:', interventionData)

      let response: Response

      try {
        response = await fetch('/api/admin/interventions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(interventionData)
        })
      } catch (fetchError) {
        console.error('Network error:', fetchError)
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.')
      }

      if (!response.ok) {
        let errorData: { error?: string } = {}
        let responseText = ''

        try {
          responseText = await response.text()
          errorData = JSON.parse(responseText)
        } catch (parseError) {
          console.warn('Failed to parse error response:', responseText)
        }

        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          responseText,
          errorData,
          url: response.url
        })

        // Provide specific error messages for different status codes
        if (response.status === 401) {
          throw new Error('You are not authorized to create interventions. Please log in again.')
        } else if (response.status === 403) {
          throw new Error('You do not have permission to create interventions. Only administrators can create intervention plans.')
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid intervention data provided')
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}): The server is experiencing issues. Please try again later.`)
        } else {
          throw new Error(errorData.error || `Request failed (${response.status}): ${response.statusText}`)
        }
      }

      const result = await response.json()

      toast.success(`Intervention plan created successfully for ${interventionStudent.student_name}`)
      closeInterventionModal()
      setSelectedStudent(null)

      // Refresh analytics data to show updated status
      fetchAnalytics()
    } catch (error) {
      console.error('Error creating intervention:', {
        error,
        errorType: typeof error,
        errorString: String(error),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        student: interventionStudent.student_name,
        interventions: selectedInterventions,
        priority: interventionPriority
      })

      // Show user-friendly error message
      if (error instanceof Error && error.message) {
        toast.error(error.message)
      } else if (typeof error === 'string') {
        toast.error(error)
      } else {
        const errorString = String(error)
        if (errorString && errorString !== '[object Object]') {
          toast.error(`Error: ${errorString}`)
        } else {
          toast.error('An unexpected error occurred while creating the intervention plan. Please check your connection and try again.')
        }
      }
    } finally {
      setInterventionLoading(false)
    }
  }, [interventionStudent, selectedInterventions, interventionPriority, interventionNotes, closeInterventionModal, fetchAnalytics])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Escape to close modals or clear search
      if (e.key === 'Escape') {
        if (showInterventionModal) {
          closeInterventionModal()
        } else if (selectedStudent) {
          setSelectedStudent(null)
        } else if (searchTerm) {
          setSearchTerm('')
        }
        return
      }

      // Ctrl/Cmd + R to refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        fetchAnalytics()
      }
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [fetchAnalytics, searchTerm, selectedStudent, showInterventionModal, closeInterventionModal])

  // Filtered analytics
  const filteredAnalytics = useMemo(() => {
    if (!debouncedSearch) return analytics

    const search = debouncedSearch.toLowerCase()
    return analytics.filter(analytic =>
      analytic.student_name.toLowerCase().includes(search) ||
      analytic.student_grade?.toLowerCase().includes(search) ||
      analytic.risk_level.toLowerCase().includes(search)
    )
  }, [analytics, debouncedSearch])

  // Memoized helper functions
  const getRiskLevelColor = useCallback((riskLevel: string) => {
    switch (riskLevel) {
      case 'thriving': return 'from-emerald-500 to-green-600'
      case 'low': return 'from-green-500 to-emerald-600'
      case 'medium': return 'from-yellow-500 to-orange-600'
      case 'high': return 'from-orange-500 to-red-600'
      case 'critical': return 'from-red-500 to-red-700'
      default: return 'from-gray-500 to-gray-600'
    }
  }, [])

  const getRiskLevelIcon = useCallback((riskLevel: string) => {
    switch (riskLevel) {
      case 'thriving': return Award
      case 'low': return Shield
      case 'medium': return AlertCircle
      case 'high': return AlertTriangle
      case 'critical': return AlertTriangle
      default: return AlertCircle
    }
  }, [])

  const getTrendIcon = useCallback((trend?: string) => {
    switch (trend) {
      case 'improving': return TrendingUp
      case 'declining': return TrendingDown
      default: return Activity
    }
  }, [])

  const formatScore = useCallback((score: number) => {
    if (score === null || score === undefined) return '0.0'
    return Number(score).toFixed(1)
  }, [])

  // Handle keyboard navigation
  const handleCardKeyPress = (e: React.KeyboardEvent, analytic: WellbeingAnalytic) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelectedStudent(analytic)
    }
  }

  // Generate CSV export data
  const generateCSV = () => {
    const headers = [
      'Student Name',
      'Grade',
      'Risk Level',
      'Overall Score',
      'Emotional Score',
      'Academic Score',
      'Engagement Score',
      'Risk Factors',
      'Protective Factors',
      'Trend',
      'Intervention Recommended',
      'Analysis Date'
    ]

    const rows = filteredAnalytics.map(a => [
      a.student_name || 'Unknown',
      a.student_grade || 'N/A',
      a.risk_level || 'N/A',
      formatScore(a.overall_wellbeing_score),
      formatScore(a.emotional_wellbeing_score),
      formatScore(a.academic_wellbeing_score),
      formatScore(a.engagement_wellbeing_score),
      a.risk_factor_count || 0,
      a.protective_factor_count || 0,
      a.overall_score_trend || 'stable',
      a.intervention_recommended ? 'Yes' : 'No',
      a.analysis_date ? new Date(a.analysis_date).toLocaleDateString() : 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wellbeing-severity-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success(`Exported ${filteredAnalytics.length} records to CSV`)
  }

  return (
    <>
      <style jsx global>{`
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .enterprise-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .dark .enterprise-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .metric-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .metric-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .enterprise-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .status-indicator {
          position: relative;
        }
        
        .status-indicator::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
          border-radius: inherit;
          opacity: 0.7;
          filter: blur(8px);
          z-index: -1;
        }
        
        .data-visualization {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
        }
        
        @keyframes enterprise-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Neon Theme Styles */
        .neon-card {
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(6, 182, 212, 0.3);
          box-shadow: 
            0 0 20px rgba(6, 182, 212, 0.2),
            inset 0 0 20px rgba(6, 182, 212, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .neon-card:hover {
          border-color: rgba(6, 182, 212, 0.6);
          box-shadow: 
            0 0 30px rgba(6, 182, 212, 0.4),
            0 0 60px rgba(6, 182, 212, 0.2),
            inset 0 0 30px rgba(6, 182, 212, 0.1);
          transform: translateY(-4px);
        }
        
        .neon-border-top {
          position: relative;
        }
        
        .neon-border-top::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(6, 182, 212, 0.8), 
            rgba(59, 130, 246, 0.8),
            transparent
          );
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.8);
        }
        
        @keyframes neon-pulse {
          0%, 100% {
            box-shadow: 
              0 0 20px rgba(6, 182, 212, 0.4),
              inset 0 0 20px rgba(6, 182, 212, 0.1);
          }
          50% {
            box-shadow: 
              0 0 40px rgba(6, 182, 212, 0.6),
              0 0 80px rgba(6, 182, 212, 0.3),
              inset 0 0 30px rgba(6, 182, 212, 0.2);
          }
        }
        
        .neon-pulse {
          animation: neon-pulse 2s ease-in-out infinite;
        }
        
        .neon-text {
          color: rgba(6, 182, 212, 1);
          text-shadow: 
            0 0 10px rgba(6, 182, 212, 0.8),
            0 0 20px rgba(6, 182, 212, 0.4),
            0 0 30px rgba(6, 182, 212, 0.2);
        }
        
        .neon-glow {
          box-shadow: 
            0 0 15px rgba(6, 182, 212, 0.5),
            0 0 30px rgba(6, 182, 212, 0.3),
            0 0 45px rgba(6, 182, 212, 0.1);
        }
        
        .enterprise-fade-in {
          animation: enterprise-fade-in 0.6s ease-out;
        }
        
        .professional-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }
        
        @media (min-width: 640px) {
          .professional-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
        }
        
        @media (min-width: 1024px) {
          .professional-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
        }
        
        @media (min-width: 1280px) {
          .professional-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        .mobile-optimized {
          padding: 0.75rem;
        }
        
        @media (min-width: 768px) {
          .mobile-optimized {
            padding: 1.5rem;
          }
        }
        
        .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
        
        .mobile-text {
          font-size: 0.875rem;
        }
        
        @media (min-width: 768px) {
          .mobile-text {
            font-size: 1rem;
          }
        }
      `}</style>

      <div
        className={`min-h-screen transition-all duration-1000 ${neonMode
          ? 'bg-black'
          : darkMode
            ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
            : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
          }`}
        style={{
          backgroundImage: neonMode
            ? `
              linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px),
              radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)
            `
            : particleSystem
              ? `
              radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
            `
              : undefined,
          backgroundSize: neonMode ? '50px 50px, 50px 50px, 100% 100%, 100% 100%' : undefined
        }}
      >
        {/* Futuristic Neural Header */}
        <div
          className="relative overflow-hidden"
        >
          {/* Background Neural Network Animation */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
          </div>

          {/* Glassmorphism Header */}
          <div className={`relative backdrop-blur-xl border-b transition-all duration-500 ${neonMode
            ? 'bg-black/95 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)]'
            : darkMode
              ? 'bg-white/5 border-white/10'
              : 'bg-white/80 border-white/20'
            } shadow-2xl sticky top-0 z-10`}>
            <div className="relative z-10">
              <div className="max-w-7xl mx-auto mobile-optimized py-4 md:py-8">
                {/* Mobile-Optimized Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-4 md:p-6 mb-4 md:mb-8 transition-all duration-500 ${neonMode ? 'neon-card neon-border-top' : 'enterprise-card'
                    }`}
                >
                  <div className="flex flex-col gap-4">
                    {/* Mobile Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Link
                          href="/admin"
                          className={`touch-target p-2 rounded-xl ${darkMode
                            ? 'bg-white/10 hover:bg-white/20'
                            : 'bg-gray-100 hover:bg-gray-200'
                            } transition-colors`}
                          aria-label="Back to admin dashboard"
                        >
                          <ArrowLeft className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                        </Link>

                        <div>
                          <h1 className={`text-lg md:text-2xl lg:text-3xl font-bold tracking-tight transition-all duration-500 ${neonMode
                            ? 'neon-text'
                            : darkMode
                              ? 'text-white'
                              : 'text-slate-900'
                            }`}>
                            Student Wellbeing
                          </h1>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-semibold rounded-full">
                              ENTERPRISE
                            </div>
                            <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded">
                              v2.1.0
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNeonMode(!neonMode)}
                          className={`touch-target p-2 transition-all duration-500 ${neonMode
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)]'
                            : 'border-gray-300 hover:border-cyan-400'
                            }`}
                          title="Toggle Neon Mode"
                        >
                          <Zap className={`h-4 w-4 transition-all duration-500 ${neonMode ? 'text-white animate-pulse' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchAnalytics}
                          disabled={loading}
                          className="touch-target p-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Status Indicators */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 px-2 py-1 bg-white/10 dark:bg-black/10 rounded-lg backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          Live
                        </span>
                      </div>

                      <div className="flex items-center gap-1 px-2 py-1 bg-white/10 dark:bg-black/10 rounded-lg backdrop-blur-sm">
                        <Shield className="h-3 w-3 text-blue-400" />
                        <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          FERPA
                        </span>
                      </div>

                      <div className="flex items-center gap-1 px-2 py-1 bg-white/10 dark:bg-black/10 rounded-lg backdrop-blur-sm">
                        <Users className="h-3 w-3 text-purple-400" />
                        <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {summary?.total || 0} Students
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Futuristic Main Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Advanced Analytics Dashboard */}
          <div className="space-y-8">

            {/* Neural Network Summary Stats */}
            {loading ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}
                    className={`${darkMode ? 'dark-glassmorphism' : 'glassmorphism'} rounded-2xl p-6 quantum-pulse`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl mb-4 animate-pulse" />
                    <div className="h-8 bg-gradient-to-r from-blue-300 to-purple-300 rounded-lg w-16 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-300 rounded w-24 animate-pulse" />
                  </div>
                ))}
              </motion.div>
            ) : summary && (
              <div
                className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'} ${isMobile ? 'gap-2' : 'md:gap-4'}`}
              >
                {/* Professional Enterprise KPI Cards */}
                {[
                  {
                    label: 'Students Monitored',
                    value: summary.total,
                    icon: Users,
                    change: '+2.3%',
                    trend: 'up',
                    subtitle: 'Active this week',
                    color: 'bg-gradient-to-r from-blue-600 to-blue-700',
                    lightBg: 'bg-blue-50',
                    darkBg: 'bg-blue-950/50'
                  },
                  {
                    label: 'Risk Alerts',
                    value: summary.high_risk_count,
                    icon: AlertTriangle,
                    change: '-12%',
                    trend: 'down',
                    subtitle: 'Requiring attention',
                    color: 'bg-gradient-to-r from-red-600 to-red-700',
                    lightBg: 'bg-red-50',
                    darkBg: 'bg-red-950/50'
                  },
                  {
                    label: 'Active Interventions',
                    value: summary.interventions_needed,
                    icon: Target,
                    change: '+8.1%',
                    trend: 'up',
                    subtitle: 'In progress',
                    color: 'bg-gradient-to-r from-amber-600 to-orange-700',
                    lightBg: 'bg-amber-50',
                    darkBg: 'bg-amber-950/50'
                  },
                  {
                    label: 'Positive Trends',
                    value: summary.improving_trend,
                    icon: TrendingUp,
                    change: '+15.2%',
                    trend: 'up',
                    subtitle: 'Showing improvement',
                    color: 'bg-gradient-to-r from-emerald-600 to-green-700',
                    lightBg: 'bg-emerald-50',
                    darkBg: 'bg-emerald-950/50'
                  },
                  {
                    label: 'Wellbeing Score',
                    value: formatScore(summary.average_scores?.overall || 0),
                    icon: Heart,
                    change: '+3.7%',
                    trend: 'up',
                    subtitle: 'School average',
                    color: 'bg-gradient-to-r from-purple-600 to-violet-700',
                    lightBg: 'bg-purple-50',
                    darkBg: 'bg-purple-950/50'
                  },
                  {
                    label: 'Support Referrals',
                    value: Math.round((summary.declining_trend / summary.total) * 100) || 0,
                    icon: BookOpen,
                    change: '-5.4%',
                    trend: 'down',
                    subtitle: 'This month',
                    color: 'bg-gradient-to-r from-indigo-600 to-blue-700',
                    lightBg: 'bg-indigo-50',
                    darkBg: 'bg-indigo-950/50'
                  }
                ].map((kpi, index) => (
                  <div
                    key={index}
                    className={`rounded-xl ${isMobile ? 'p-3' : 'p-4 md:p-6'} backdrop-blur-sm transition-all duration-500 hover:scale-105 ${neonMode
                      ? 'neon-card'
                      : darkMode
                        ? `${kpi.darkBg} border border-white/10 shadow-lg hover:shadow-xl`
                        : `${kpi.lightBg} border border-white/20 shadow-lg hover:shadow-xl`
                      }`}
                  >
                    <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                      <div className={`${isMobile ? 'p-2' : 'p-3'} rounded-xl shadow-lg transition-all duration-500 ${neonMode ? 'bg-cyan-500/20 border border-cyan-500/50' : kpi.color
                        }`}>
                        <kpi.icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${neonMode ? 'text-cyan-400' : 'text-white'}`} />
                      </div>
                      {!isMobile && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${kpi.trend === 'up'
                          ? neonMode
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : neonMode
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                          {kpi.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {kpi.change}
                        </div>
                      )}
                    </div>

                    <div className={`space-y-1 ${isMobile ? 'space-y-0.5' : 'space-y-2'}`}>
                      <div className={`font-bold ${isMobile ? 'text-xl' : 'text-3xl'} transition-all duration-500 ${neonMode ? 'neon-text' : darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        {kpi.value}
                      </div>
                      <div className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'} transition-all duration-500 ${neonMode ? 'text-cyan-300' : darkMode ? 'text-gray-200' : 'text-gray-700'
                        } ${isMobile ? 'leading-tight' : ''}`}>
                        {isMobile ? kpi.label.split(' ').slice(0, 2).join(' ') : kpi.label}
                      </div>
                      {!isMobile && (
                        <div className={`text-xs transition-all duration-500 ${neonMode ? 'text-cyan-400/70' : darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          {kpi.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Progress indicator */}
                    <div className={`mt-4 h-1 rounded-full overflow-hidden ${neonMode ? 'bg-cyan-900/30' : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${neonMode ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : kpi.color
                          }`}
                        style={{ width: `${Math.min((Number(kpi.value) / (summary.total || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Professional Search & Analytics Controls */}
            <div
              className={`rounded-xl space-y-4 md:space-y-6 transition-all duration-500 ${isMobile ? 'p-3' : 'p-3 md:p-4 lg:p-6'} ${neonMode ? 'neon-card' : 'enterprise-card'
                }`}
            >
              {/* Search Section */}
              <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base md:text-lg'} ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {isMobile ? 'Search & Analytics' : 'Student Search & Analytics'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateCSV}
                      disabled={filteredAnalytics.length === 0}
                      className={`touch-target ${isMobile ? 'text-xs px-2 py-1' : 'text-xs md:text-sm'}`}
                    >
                      <Download className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3 md:h-4 md:w-4'} ${isMobile ? 'mr-1' : 'mr-1 md:mr-2'}`} />
                      <span className={isMobile ? 'text-xs' : 'hidden sm:inline'}>Export</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className={`touch-target ${isMobile ? 'text-xs px-2 py-1' : 'text-xs md:text-sm'}`}
                    >
                      <Filter className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3 md:h-4 md:w-4'} ${isMobile ? 'mr-1' : 'mr-1 md:mr-2'}`} />
                      <span className={isMobile ? 'text-xs' : 'hidden sm:inline'}>Filters</span>
                    </Button>
                  </div>
                </div>

                <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                    <Input
                      placeholder={isMobile ? "Search..." : "Search students..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`${isMobile ? 'pl-9 h-9 text-sm' : 'pl-10 h-10 md:h-11 text-sm md:text-base'}`}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 touch-target p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Select value={periodType} onValueChange={setPeriodType}>
                      <SelectTrigger className="w-full sm:w-32 md:w-40 h-10 text-xs md:text-sm">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                      <SelectTrigger className="w-full sm:w-36 md:w-44 h-10 text-xs md:text-sm">
                        <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="thriving">💚 Thriving</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Results Summary */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  <div>
                    <span className="font-semibold">{filteredAnalytics.length}</span> of{' '}
                    <span className="font-semibold">{analytics.length}</span> students
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs">Live</span>
                    </div>
                    <div className="text-xs">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Cards Grid - Enhanced View */}
            <div className="space-y-6">
              {/* Neural Network Student Grid */}
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${darkMode ? 'dark-glassmorphism' : 'glassmorphism'} rounded-2xl p-8 text-center`}
                >
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Error Loading Data
                  </h3>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{error}</p>
                  <Button onClick={fetchAnalytics} className="bg-gradient-to-r from-blue-500 to-purple-500">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </motion.div>
              ) : filteredAnalytics.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${darkMode ? 'dark-glassmorphism' : 'glassmorphism'} rounded-2xl p-8 text-center`}
                >
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    No Students Found
                  </h3>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Try adjusting your search or filter criteria.
                  </p>
                </motion.div>
              ) : (
                <div className="professional-grid">
                  {filteredAnalytics.map((analytic) => {
                    const RiskIcon = getRiskLevelIcon(analytic.risk_level)
                    const riskColor =
                      analytic.risk_level === 'critical' ? 'from-red-600 to-red-700' :
                        analytic.risk_level === 'high' ? 'from-orange-600 to-red-600' :
                          analytic.risk_level === 'medium' ? 'from-yellow-600 to-orange-600' :
                            analytic.risk_level === 'low' ? 'from-green-600 to-emerald-600' :
                              'from-emerald-600 to-green-600'

                    return (
                      <div
                        key={analytic.id}
                        className={`rounded-xl cursor-pointer group enterprise-fade-in transition-all duration-500 ${isMobile ? 'p-3' : 'p-3 md:p-4 lg:p-6'} ${neonMode ? 'neon-card hover:neon-pulse' : 'enterprise-card metric-card'
                          }`}
                        onClick={() => setSelectedStudent(analytic)}
                      >
                        {/* Student Header */}
                        <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-3 md:mb-4 lg:mb-6'}`}>
                          <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-2 md:gap-3 lg:gap-4'}`}>
                            {/* Avatar or Icon */}
                            <div className="relative">
                              {analytic.student_avatar ? (
                                <NextImage
                                  src={analytic.student_avatar}
                                  alt={analytic.student_name}
                                  width={48}
                                  height={48}
                                  className={`object-cover border-2 shadow-sm transition-all duration-500 ${neonMode ? 'border-cyan-500/50' : 'border-white'
                                    } ${isMobile ? 'w-8 h-8 rounded-lg' : 'w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg md:rounded-xl'}`}
                                />
                              ) : (
                                <div className={`bg-gradient-to-r ${riskColor} flex items-center justify-center shadow-sm ${isMobile ? 'w-8 h-8 rounded-lg' : 'w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg md:rounded-xl'}`}>
                                  <User className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
                                </div>
                              )}
                              <div className={`absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 transition-all duration-500 ${neonMode ? 'border-black' : 'border-white'
                                } ${analytic.risk_level === 'critical' ? 'bg-red-500' :
                                  analytic.risk_level === 'high' ? 'bg-orange-500' :
                                    analytic.risk_level === 'medium' ? 'bg-yellow-500' :
                                      analytic.risk_level === 'low' ? 'bg-green-500' :
                                        'bg-emerald-500'
                                }`}></div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold truncate ${isMobile ? 'text-sm' : 'text-sm md:text-base'} transition-all duration-500 ${neonMode ? 'text-cyan-300' : darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                {analytic.student_name}
                              </h3>
                              <p className={`${isMobile ? 'text-xs' : 'text-xs md:text-sm'} transition-all duration-500 ${neonMode ? 'text-cyan-400/70' : darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                {isMobile ? analytic.student_grade.replace('Grade ', 'G') : analytic.student_grade} • {analytic.student_id.slice(-4)}
                              </p>
                            </div>
                          </div>

                          {/* Risk Status */}
                          <div className={`flex flex-col items-end ${isMobile ? 'gap-1' : 'gap-2'}`}>
                            <div className={`${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-lg ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium transition-all duration-500 ${neonMode
                                ? analytic.risk_level === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                  analytic.risk_level === 'high' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                    analytic.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                      analytic.risk_level === 'low' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : analytic.risk_level === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                  analytic.risk_level === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                    analytic.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                      analytic.risk_level === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                              }`}>
                              {isMobile ? analytic.risk_level.charAt(0).toUpperCase() + analytic.risk_level.slice(1) : analytic.risk_level.toUpperCase()}
                            </div>
                            {!isMobile && (
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Score: {formatScore(analytic.overall_wellbeing_score)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className={`grid grid-cols-2 ${isMobile ? 'gap-2 mb-3' : 'gap-4 mb-4'}`}>
                          <div className="space-y-1">
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Emotional
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {formatScore(analytic.emotional_wellbeing_score)}
                              </div>
                              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                  style={{ width: `${(analytic.emotional_wellbeing_score / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Academic
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {formatScore(analytic.academic_wellbeing_score)}
                              </div>
                              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                                  style={{ width: `${(analytic.academic_wellbeing_score / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2 md:pt-3 lg:pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2 md:gap-3 text-xs">
                            <div className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                              <Activity className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span className="text-xs">{analytic.risk_factor_count}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                              <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span className="text-xs">{analytic.protective_factor_count}</span>
                            </div>
                          </div>

                          <div className={`flex ${isMobile ? 'gap-1' : 'gap-1.5 md:gap-2'}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`touch-target ${isMobile ? 'h-6 text-[10px] px-1.5' : 'h-7 md:h-8 text-xs px-2 md:px-3'}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedStudent(analytic)
                              }}
                            >
                              <Eye className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} ${!isMobile ? 'md:mr-1' : ''}`} />
                              <span className={isMobile ? 'sr-only' : 'hidden md:inline'}>View</span>
                            </Button>
                            {analytic.intervention_recommended && (
                              <Button
                                size="sm"
                                className={`bg-red-600 hover:bg-red-700 touch-target ${isMobile ? 'h-6 text-[10px] px-1.5' : 'h-7 md:h-8 text-xs px-2 md:px-3'}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setInterventionStudent(analytic)
                                  setShowInterventionModal(true)
                                }}
                              >
                                <Target className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} ${!isMobile ? 'md:mr-1' : ''}`} />
                                <span className={isMobile ? 'sr-only' : 'hidden md:inline'}>{isMobile ? 'Action' : 'Act'}</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`enterprise-card overflow-hidden ${isMobile ? 'rounded-t-2xl w-full h-full max-h-none mt-16' : 'rounded-2xl w-full max-w-4xl max-h-[90vh]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {selectedStudent.student_avatar ? (
                        <NextImage
                          src={selectedStudent.student_avatar}
                          alt={selectedStudent.student_name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-lg"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${selectedStudent.risk_level === 'critical' ? 'from-red-600 to-red-700' :
                          selectedStudent.risk_level === 'high' ? 'from-orange-600 to-red-600' :
                            selectedStudent.risk_level === 'medium' ? 'from-yellow-600 to-orange-600' :
                              selectedStudent.risk_level === 'low' ? 'from-green-600 to-emerald-600' :
                                'from-emerald-600 to-green-600'
                          } flex items-center justify-center shadow-lg`}>
                          <User className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${selectedStudent.risk_level === 'critical' ? 'bg-red-500' :
                        selectedStudent.risk_level === 'high' ? 'bg-orange-500' :
                          selectedStudent.risk_level === 'medium' ? 'bg-yellow-500' :
                            selectedStudent.risk_level === 'low' ? 'bg-green-500' :
                              'bg-emerald-500'
                        }`}></div>
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedStudent.student_name}
                      </h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedStudent.student_grade} • {selectedStudent.student_class} • ID: {selectedStudent.student_id.slice(-6)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${selectedStudent.risk_level === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          selectedStudent.risk_level === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                            selectedStudent.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              selectedStudent.risk_level === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          }`}>
                          {selectedStudent.risk_level.toUpperCase()} RISK
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${selectedStudent.overall_score_trend === 'improving' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          selectedStudent.overall_score_trend === 'declining' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                          {selectedStudent.overall_score_trend === 'improving' ? '📈 IMPROVING' :
                            selectedStudent.overall_score_trend === 'declining' ? '📉 DECLINING' : '➡️ STABLE'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStudent(null)}
                    className="touch-target"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Wellbeing Scores */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Wellbeing Scores
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Overall Wellbeing', value: selectedStudent.overall_wellbeing_score, color: 'blue' },
                        { label: 'Emotional Health', value: selectedStudent.emotional_wellbeing_score, color: 'purple' },
                        { label: 'Academic Performance', value: selectedStudent.academic_wellbeing_score, color: 'green' },
                        { label: 'Social Engagement', value: selectedStudent.social_wellbeing_score, color: 'yellow' },
                        { label: 'Behavioral Patterns', value: selectedStudent.behavioral_wellbeing_score, color: 'red' }
                      ].map((score) => (
                        <div key={score.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {score.label}
                            </span>
                            <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatScore(score.value)}/10
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(score.value / 10) * 100}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className={`h-3 rounded-full bg-gradient-to-r ${score.color === 'blue' ? 'from-blue-500 to-blue-600' :
                                score.color === 'purple' ? 'from-purple-500 to-purple-600' :
                                  score.color === 'green' ? 'from-green-500 to-green-600' :
                                    score.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                                      'from-red-500 to-red-600'
                                }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'GPA', value: selectedStudent.gpa?.toFixed(2) || 'N/A', icon: '📊' },
                        { label: 'Attendance', value: `${(selectedStudent.attendance_rate * 100).toFixed(1)}%`, icon: '📅' },
                        { label: 'XP Earned', value: selectedStudent.xp_earned?.toLocaleString() || '0', icon: '⭐' },
                        { label: 'Quest Completion', value: `${(selectedStudent.quest_completion_rate * 100).toFixed(1)}%`, icon: '🎯' },
                        { label: 'Help Requests', value: selectedStudent.help_requests_count || 0, icon: '🆘' },
                        { label: 'Incidents', value: selectedStudent.incident_count || 0, icon: '⚠️' }
                      ].map((metric) => (
                        <div key={metric.label} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{metric.icon}</span>
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {metric.label}
                            </span>
                          </div>
                          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {metric.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Risk Factors ({selectedStudent.risk_factor_count})
                    </h3>
                    <div className="space-y-2">
                      {selectedStudent.risk_factors?.length > 0 ? (
                        selectedStudent.risk_factors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                              {factor}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No significant risk factors identified
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Protective Factors */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Protective Factors ({selectedStudent.protective_factor_count})
                    </h3>
                    <div className="space-y-2">
                      {selectedStudent.protective_factors?.length > 0 ? (
                        selectedStudent.protective_factors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <Shield className="h-4 w-4 text-green-500" />
                            <span className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                              {factor}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No protective factors identified
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Predictions & Insights */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      AI Insights & Predictions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-5 w-5 text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            Predicted Next Score
                          </span>
                        </div>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatScore(selectedStudent.predicted_next_score)}/10
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Confidence: {(selectedStudent.confidence_level * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-purple-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-purple-500" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                            School Percentile
                          </span>
                        </div>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedStudent.school_percentile?.toFixed(0) || 'N/A'}%
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Grade: {selectedStudent.grade_percentile?.toFixed(0) || 'N/A'}%
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-5 w-5 text-green-500" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                            Data Quality
                          </span>
                        </div>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {(selectedStudent.data_quality_score * 100).toFixed(0)}%
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Completeness: {selectedStudent.data_completeness_percentage?.toFixed(0) || 'N/A'}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  {selectedStudent.recommended_actions?.length > 0 && (
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Recommended Actions
                      </h3>
                      <div className="space-y-2">
                        {selectedStudent.recommended_actions.map((action, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                            <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              {action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedStudent(null)}
                    className="flex-1 touch-target"
                  >
                    Close
                  </Button>
                  {selectedStudent.intervention_recommended && (
                    <Button
                      onClick={() => {
                        setInterventionStudent(selectedStudent)
                        setShowInterventionModal(true)
                        setSelectedStudent(null)
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 touch-target"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Create Intervention Plan
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intervention Modal */}
      <AnimatePresence>
        {showInterventionModal && interventionStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeInterventionModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="enterprise-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Create Intervention Plan
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {interventionStudent.student_name} • {interventionStudent.student_grade} • Risk: {interventionStudent.risk_level}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeInterventionModal}
                  className="touch-target"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Priority Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Intervention Priority
                  </label>
                  <Select value={interventionPriority} onValueChange={(value) => setInterventionPriority(value as 'urgent' | 'high' | 'medium')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">🔴 Urgent - Immediate Action Required</SelectItem>
                      <SelectItem value="high">🟠 High - Action Within 24 Hours</SelectItem>
                      <SelectItem value="medium">🟡 Medium - Action Within Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Intervention Options */}
                <div>
                  <div
                    className={`mb-6 ${isMobile ? 'mb-4' : 'mb-8'}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <Link href="/admin" className="lg:hidden">
                          <Button variant="ghost" size="sm" className="touch-target p-2">
                            <ArrowLeft className="h-5 w-5" />
                          </Button>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl shadow-lg ${isMobile ? 'p-1.5' : 'p-2'}`}>
                              <AlertTriangle className={`text-white ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h1 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                                {isMobile ? 'Wellbeing Analytics' : 'Wellbeing Severity Analytics'}
                              </h1>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>
                                {isMobile ? 'AI Risk Assessment' : 'ENTERPRISE v2.1.0 • Advanced AI-Powered Risk Assessment'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Select Interventions ({selectedInterventions.length} selected)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {interventionOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => toggleIntervention(option.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedInterventions.includes(option.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{option.icon}</span>
                          <div className="flex-1">
                            <h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {option.label}
                            </h3>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {option.description}
                            </p>
                          </div>
                          {selectedInterventions.includes(option.id) && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Additional Notes
                  </label>
                  <textarea
                    value={interventionNotes}
                    onChange={(e) => setInterventionNotes(e.target.value)}
                    placeholder="Add any specific notes, observations, or instructions..."
                    className={`w-full p-3 rounded-xl border resize-none ${darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={closeInterventionModal}
                    className="flex-1 touch-target"
                    disabled={interventionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitIntervention}
                    disabled={selectedInterventions.length === 0 || interventionLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 touch-target"
                  >
                    {interventionLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Create Intervention Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
