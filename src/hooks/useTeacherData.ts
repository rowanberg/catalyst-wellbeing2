/**
 * Teacher Data Hook - OPTIMIZED
 * React Query-inspired pattern with caching, retries, and performance tracking
 * Reduced 20 console.log → logger (95% reduction)
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { logger } from '@/lib/logger'

interface TeacherData {
  teacher: any
  school: any
  assignedClasses: any[]
  grades: any[]
  classes: any[]
  students: any[]
  analytics: any
}

interface UseTeacherDataOptions {
  includeStudents?: boolean
  classId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseTeacherDataReturn {
  data: TeacherData
  loading: boolean
  studentsLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
  setClassId: (classId: string) => void
  loadStudentsForClass: (classId: string) => Promise<void>
  clearCache: () => void
}

// Cache management
const cache = new Map<string, { data: TeacherData; timestamp: number; ttl: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const REFRESH_INTERVAL = 30 * 1000 // 30 seconds for auto-refresh

export function useTeacherData(options: UseTeacherDataOptions = {}): UseTeacherDataReturn {
  const { includeStudents = false, classId, autoRefresh = false, refreshInterval = REFRESH_INTERVAL } = options
  
  const { user } = useAppSelector((state) => state.auth)
  const [data, setData] = useState<TeacherData>({
    teacher: null,
    school: null,
    assignedClasses: [],
    grades: [],
    classes: [],
    students: [],
    analytics: null
  })
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentClassId, setCurrentClassId] = useState<string | undefined>(classId)
  const [retryCount, setRetryCount] = useState(0)
  
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  // Generate cache key
  const getCacheKey = useCallback((teacherId: string, schoolId: string, classId?: string, includeStudents?: boolean) => {
    return `teacher-data-${teacherId}-${schoolId}-${classId || 'no-class'}-${includeStudents ? 'with-students' : 'no-students'}`
  }, [])

  // Check cache
  const getCachedData = useCallback((cacheKey: string): TeacherData | null => {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      logger.debug('Using cached teacher data')
      return cached.data
    }
    return null
  }, [])

  // Set cache
  const setCachedData = useCallback((cacheKey: string, data: TeacherData) => {
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    })
    logger.debug('Cached teacher data')
  }, [])

  // Fetch data function
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Wait for user data to be available instead of immediately erroring
    if (!user) {
      // Keep loading state true while waiting for auth
      return
    }
    
    if (!user.id) {
      setError('Authentication required - missing user data')
      setLoading(false)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()

    try {
      setError(null)
      if (forceRefresh) {
        setLoading(true)
      }

      // Get school_id from profile
      let schoolId: string | undefined
      const profileResponse = await fetch('/api/profile')
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        schoolId = profile.school_id
        
        logger.debug('Profile fetched', { 
          userId: user.id, 
          profileId: profile.id,
          role: profile.role,
          hasSchoolId: !!schoolId 
        })
      } else {
        logger.error('Failed to fetch profile', { 
          status: profileResponse.status,
          statusText: profileResponse.statusText 
        })
      }
      
      if (!schoolId) {
        logger.error('School ID not found in profile', { 
          userId: user.id,
          profileFetched: profileResponse.ok
        })
        throw new Error('School ID not found in profile. Please contact your administrator to assign you to a school.')
      }

      const cacheKey = getCacheKey(user.id, schoolId, currentClassId, includeStudents)
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedData(cacheKey)
        if (cachedData) {
          setData(cachedData)
          setLoading(false)
          return
        }
      }

      logger.debug('🔄 Fetching teacher data...', { 
        teacherId: user.id, 
        schoolId: schoolId, 
        classId: currentClassId, 
        includeStudents 
      })

      // Build query parameters
      const params = new URLSearchParams({
        teacher_id: user.id,
        school_id: schoolId,
        include_students: includeStudents.toString()
      })
      
      if (currentClassId) {
        params.append('class_id', currentClassId)
      }

      const response = await fetch(`/api/teacher/data?${params}`, {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        setCachedData(cacheKey, result.data)
        setRetryCount(0) // Reset retry count on success
        logger.debug('Teacher data fetched successfully')
      } else {
        throw new Error(result.message || 'Failed to fetch data')
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        logger.error('❌ Error fetching teacher data:', error)
        
        // Retry logic for network errors
        if (retryCount < 2 && (error.message.includes('fetch') || error.message.includes('network'))) {
          logger.debug(`🔄 Retrying fetch (attempt ${retryCount + 1}/2)...`)
          setRetryCount(prev => prev + 1)
          setTimeout(() => fetchData(forceRefresh), 1000 * (retryCount + 1)) // Exponential backoff
          return
        }
        
        setError(error.message || 'Failed to fetch data')
        setRetryCount(0) // Reset retry count on final failure
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentClassId, includeStudents, getCacheKey, getCachedData, setCachedData, retryCount])

  // Refresh data function
  const refreshData = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  // Set class ID function
  const setClassId = useCallback((newClassId: string) => {
    setCurrentClassId(newClassId)
  }, [])

  // Load students for a specific class (optimized for immediate loading)
  const loadStudentsForClass = useCallback(async (classId: string) => {
    logger.debug('🚀 loadStudentsForClass called with:', { classId, userId: user?.id, hasUser: !!user })
    
    if (!classId || classId === 'null' || classId === 'undefined') {
      logger.debug('Invalid class ID', { classId })
      return
    }
    
    if (!user?.id) {
      logger.debug('No user ID available')
      return
    }

    setStudentsLoading(true)
    setError(null)

    try {
      logger.debug('Fast loading students for class', { classId })
      
      // Get school_id from teacher profile
      logger.debug('Fetching school_id from profile')
      let schoolId: string | undefined
      const profileResponse = await fetch('/api/profile')
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        schoolId = profile.school_id
        logger.debug('Got school_id from profile', { 
          schoolId, 
          profileId: profile.id,
          role: profile.role 
        })
      } else {
        logger.error('Failed to fetch profile', { 
          status: profileResponse.status,
          statusText: profileResponse.statusText 
        })
      }
      
      if (!schoolId) {
        logger.error('School ID not found in profile for loadStudentsForClass', { 
          userId: user.id,
          classId
        })
        throw new Error('School ID not found in profile. Please contact your administrator.')
      }
      
      logger.debug('📡 Making API call with:', { schoolId, classId })
      const response = await fetch(`/api/teacher/students?school_id=${schoolId}&class_id=${classId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.students) {
        // Update only the students data without affecting other data
        setData(prevData => ({
          ...prevData,
          students: result.students
        }))
        
        // Update cache with new students data
        const cacheKey = getCacheKey(user.id, schoolId, classId, true)
        const cachedData = getCachedData(cacheKey)
        if (cachedData) {
          setCachedData(cacheKey, {
            ...cachedData,
            students: result.students
          })
        }
        
        logger.debug('Students loaded successfully', { count: result.students.length })
      }
    } catch (error: any) {
      logger.error('❌ Error loading students:', error)
      setError(error.message || 'Failed to load students')
    } finally {
      setStudentsLoading(false)
    }
  }, [user?.id, getCacheKey, getCachedData, setCachedData])

  // Clear cache function
  const clearCache = useCallback(() => {
    cache.clear()
    logger.debug('Teacher data cache cleared')
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && !loading) {
      refreshIntervalRef.current = setInterval(() => {
        logger.debug('Auto-refreshing teacher data')
        fetchData()
      }, refreshInterval)

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
    return undefined
  }, [autoRefresh, refreshInterval, loading, fetchData])

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    loading,
    studentsLoading,
    error,
    refreshData,
    setClassId,
    loadStudentsForClass,
    clearCache
  }
}
