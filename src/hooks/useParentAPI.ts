'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Simple cache implementation
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; staleTime: number }>()
  
  set(key: string, data: any, staleTime: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      staleTime
    })
  }
  
  get(key: string) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    const isStale = Date.now() - cached.timestamp > cached.staleTime
    if (isStale) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  invalidate(keyPattern: string) {
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key)
      }
    }
  }
  
  clear() {
    this.cache.clear()
  }
}

const apiCache = new APICache()

// Types
interface ParentDashboardData {
  actionCenter: Array<{
    type: 'alert' | 'warning' | 'info' | 'success'
    priority: 'high' | 'medium' | 'low'
    title: string
    message: string
    action: string | null
  }>
  growthMetrics: {
    gpa: string
    trend: 'up' | 'down' | 'stable'
    trendValue: string
    dayStreak: number
    weeklyXP: number
    level: number
    totalAssignments: number
    avgPercentage: string
  }
  upcomingAssignments: Array<{
    id: string
    title: string
    subject: string
    dueDate: string
    type: string
    daysUntil: number
  }>
  timeline: Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: string
    metadata: any
  }>
}

interface WellbeingData {
  analytics: Array<{
    id: string
    student_id: string
    overall_wellbeing_score: number
    emotional_wellbeing_score: number
    academic_wellbeing_score: number
    engagement_wellbeing_score: number
    social_wellbeing_score: number
    behavioral_wellbeing_score: number
    risk_level: string
    risk_score: number
    risk_factors: string[]
    protective_factors: string[]
    recommended_actions: string[]
    intervention_recommended: boolean
    intervention_type: string
    intervention_priority: string
    predicted_next_score: number
    confidence_level: number
    school_percentile: number
    gpa: number
    attendance_rate: number
    incident_count: number
    help_requests_count: number
  }>
}

interface ParentSettings {
  children: Array<{
    id: string
    name: string
    grade: string
    school: string
    avatarUrl?: string
  }>
  notifications: Record<string, {
    email: boolean
    push: boolean
    sms: boolean
  }>
  profile: {
    name: string
    email: string
    phone: string
    avatarUrl?: string
  }
}

interface CommunityPost {
  id: string
  content: string
  media: Array<{
    type: 'image' | 'video' | 'document' | 'voice'
    url: string
    thumbnail?: string
    name?: string
    duration?: string
  }>
  isPinned: boolean
  isWelcomePost?: boolean
  createdAt: string
  teacher: {
    id: string
    name: string
    avatar?: string
    className?: string
  }
  reactions: Record<string, number>
  totalReactions: number
}

// Query Keys
export const parentQueryKeys = {
  all: ['parent'] as const,
  dashboard: (studentId: string) => [...parentQueryKeys.all, 'dashboard', studentId] as const,
  wellbeing: (studentId: string) => [...parentQueryKeys.all, 'wellbeing', studentId] as const,
  settings: (parentId: string) => [...parentQueryKeys.all, 'settings', parentId] as const,
  communityFeed: (studentId: string, page: number) => [...parentQueryKeys.all, 'community', studentId, page] as const,
  analytics: (studentId: string, timeRange: string) => [...parentQueryKeys.all, 'analytics', studentId, timeRange] as const,
}

// API Functions
const fetchParentDashboard = async (studentId: string): Promise<ParentDashboardData> => {
  const response = await fetch(`/api/v1/parents/dashboard?student_id=${studentId}`, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`)
  }
  
  const result = await response.json()
  return result.data
}

const fetchWellbeingData = async (studentId: string): Promise<WellbeingData> => {
  const response = await fetch(`/api/v1/parents/wellbeing?student_id=${studentId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch wellbeing data: ${response.statusText}`)
  }
  
  const result = await response.json()
  return result.data
}

const fetchParentSettings = async (parentId: string): Promise<ParentSettings> => {
  const response = await fetch(`/api/v1/parents/settings?parent_id=${parentId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.statusText}`)
  }
  
  const result = await response.json()
  return result.data
}

const fetchCommunityFeed = async (studentId: string, page: number): Promise<{ posts: CommunityPost[], hasMore: boolean }> => {
  const response = await fetch(`/api/v1/parents/community-feed?student_id=${studentId}&page=${page}`, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch community feed: ${response.statusText}`)
  }
  
  const result = await response.json()
  return result.data
}

// Custom hook implementation
interface UseQueryResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

const useCustomQuery = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    enabled?: boolean
    staleTime?: number
    retry?: number
  } = {}
): UseQueryResult<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const fetchData = useCallback(async () => {
    if (!options.enabled && options.enabled !== undefined) return
    
    // Check cache first
    const cached = apiCache.get(key)
    if (cached) {
      setData(cached)
      return
    }
    
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)
    
    let retryCount = 0
    const maxRetries = options.retry || 3
    
    while (retryCount <= maxRetries) {
      try {
        const result = await fetchFn()
        apiCache.set(key, result, options.staleTime)
        setData(result)
        setError(null)
        break
      } catch (err) {
        if (retryCount === maxRetries) {
          const error = err instanceof Error ? err : new Error('Unknown error')
          setError(error)
          setData(null)
        } else {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * 2 ** retryCount, 30000)))
        }
      }
    }
    
    setIsLoading(false)
  }, [key, fetchFn, options.enabled, options.staleTime, options.retry])
  
  useEffect(() => {
    fetchData()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])
  
  return {
    data,
    error,
    isLoading,
    isError: !!error,
    refetch: fetchData
  }
}

// Custom Hooks
export const useParentDashboard = (studentId: string) => {
  return useCustomQuery(
    parentQueryKeys.dashboard(studentId).join('-'),
    () => fetchParentDashboard(studentId),
    {
      enabled: !!studentId,
      staleTime: 7 * 60 * 1000, // 7 minutes - slightly higher to align with Redis-backed dashboard cache
      retry: 3,
    }
  )
}

export const useWellbeingData = (studentId: string) => {
  return useCustomQuery(
    parentQueryKeys.wellbeing(studentId).join('-'),
    () => fetchWellbeingData(studentId),
    {
      enabled: !!studentId,
      staleTime: 12 * 60 * 1000, // 12 minutes - aligned with wellbeing Redis TTL (~10min local tier)
      retry: 3,
    }
  )
}

export const useParentSettings = (parentId: string) => {
  return useCustomQuery(
    parentQueryKeys.settings(parentId).join('-'),
    () => fetchParentSettings(parentId),
    {
      enabled: !!parentId,
      staleTime: 15 * 60 * 1000, // 15 minutes
      retry: 2,
    }
  )
}

export const useCommunityFeed = (studentId: string, page: number = 1) => {
  return useCustomQuery(
    parentQueryKeys.communityFeed(studentId, page).join('-'),
    () => fetchCommunityFeed(studentId, page),
    {
      enabled: !!studentId,
      staleTime: 3 * 60 * 1000, // 3 minutes - slightly relaxed for feed
      retry: 3,
    }
  )
}

// Mutation hooks
export const useUpdateParentSettings = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const mutate = useCallback(async (data: { parentId: string; settings: Partial<ParentSettings> }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/parents/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.settings),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update settings')
      }
      
      const result = await response.json()
      
      // Invalidate cache
      apiCache.invalidate('settings')
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  return { mutate, isLoading, error }
}

export const useLinkChild = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const mutate = useCallback(async (data: { parentId: string; studentId: string; studentEmail: string }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/parents/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to link child')
      }
      
      const result = await response.json()
      
      // Invalidate settings cache
      apiCache.invalidate('settings')
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  return { mutate, isLoading, error }
}

export const useReactToPost = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const mutate = useCallback(async (data: { postId: string; reaction: string; parentId: string }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/parents/community-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to react to post')
      }
      
      const result = await response.json()
      
      // Invalidate community cache
      apiCache.invalidate('community')
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  return { mutate, isLoading, error }
}

// Utility hooks
export const useRefreshAllData = () => {
  return useCallback(() => {
    apiCache.clear()
  }, [])
}

export const usePrefetchWellbeing = () => {
  return useCallback(async (studentId: string) => {
    try {
      const data = await fetchWellbeingData(studentId)
      apiCache.set(parentQueryKeys.wellbeing(studentId).join('-'), data, 12 * 60 * 1000)
    } catch (error) {
      console.warn('Failed to prefetch wellbeing data:', error)
    }
  }, [])
}

