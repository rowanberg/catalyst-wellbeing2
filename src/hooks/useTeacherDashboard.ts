import { useState, useCallback, useEffect } from 'react'

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
  const [data, setData] = useState<TeacherDashboardData | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [dataUpdatedAt, setDataUpdatedAt] = useState<number>(0)

  const fetchData = useCallback(async () => {
    if (!teacherId) return

    setIsFetching(true)
    setIsLoading(!data) // Only show loading on initial fetch
    setIsError(false)
    setError(null)

    try {
      const result = await fetchTeacherDashboard(teacherId)
      setData(result)
      setDataUpdatedAt(Date.now())
    } catch (err) {
      setIsError(true)
      setError(err as Error)
    } finally {
      setIsFetching(false)
      setIsLoading(false)
    }
  }, [teacherId, data])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  // Background refresh function (silent)
  const backgroundRefresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Prefetch function for performance (just fetch)
  const prefetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    isError,
    error,
    isRefetching: isFetching,
    refresh,
    backgroundRefresh,
    prefetch,
    // Derived states for better UX
    hasData: !!data,
    isEmpty: data?.students?.length === 0,
    // Performance metrics
    dataUpdatedAt,
    isFetching,
  }
}

// Hook for real-time updates (optional)
export const useTeacherDashboardRealtime = (teacherId: string | null, intervalMs: number = 60000) => {
  const { backgroundRefresh } = useTeacherDashboard(teacherId)

  // Set up interval for background updates
  useEffect(() => {
    if (!teacherId) return

    const interval = setInterval(() => {
      backgroundRefresh()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [teacherId, intervalMs, backgroundRefresh])
}
