import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'

interface TeacherDashboardData {
  analytics: {
    totalStudents: number
    averageXP: number
    activeToday: number
    helpRequests: number
    moodDistribution: {
      happy: number
      excited: number
      calm: number
      sad: number
      angry: number
      anxious: number
    }
    averageStreak: number
  }
  students: Array<{
    id: string
    first_name: string
    last_name: string
    xp: number
    level: number
    gems: number
    streak_days: number
    current_mood: string
    grade_level: string
    class_name: string
    class_subject: string
    class_room: string
    updated_at: string
  }>
  teacherInfo: {
    name: string
    schoolId: string
  }
  classes: Array<{
    id: string
    class_name: string
    subject: string
    room_number: string
    grade_level_id: string
  }>
}

const fetchTeacherDashboard = async (teacherId: string): Promise<TeacherDashboardData> => {
  const response = await fetch(`/api/teacher/dashboard-combined?teacher_id=${teacherId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data: ${response.status}`)
  }
  
  return response.json()
}

export const useTeacherDashboard = (teacherId: string | null) => {
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const query = useQuery({
    queryKey: ['teacher-dashboard', teacherId],
    queryFn: () => fetchTeacherDashboard(teacherId!),
    enabled: !!teacherId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!teacherId) return
    
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries({
        queryKey: ['teacher-dashboard', teacherId]
      })
      await query.refetch()
    } finally {
      setRefreshing(false)
    }
  }, [teacherId, queryClient, query])

  // Background refresh function (silent)
  const backgroundRefresh = useCallback(() => {
    if (!teacherId) return
    
    queryClient.invalidateQueries({
      queryKey: ['teacher-dashboard', teacherId]
    })
  }, [teacherId, queryClient])

  // Prefetch function for performance
  const prefetch = useCallback(() => {
    if (!teacherId) return
    
    queryClient.prefetchQuery({
      queryKey: ['teacher-dashboard', teacherId],
      queryFn: () => fetchTeacherDashboard(teacherId),
      staleTime: 30 * 1000,
    })
  }, [teacherId, queryClient])

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching || refreshing,
    refresh,
    backgroundRefresh,
    prefetch,
    // Derived states for better UX
    hasData: !!query.data,
    isEmpty: query.data?.students?.length === 0,
    // Performance metrics
    dataUpdatedAt: query.dataUpdatedAt,
    isFetching: query.isFetching,
  }
}

// Hook for real-time updates (optional)
export const useTeacherDashboardRealtime = (teacherId: string | null, intervalMs: number = 60000) => {
  const { backgroundRefresh } = useTeacherDashboard(teacherId)

  // Set up interval for background updates
  useState(() => {
    if (!teacherId) return

    const interval = setInterval(() => {
      backgroundRefresh()
    }, intervalMs)

    return () => clearInterval(interval)
  })
}
