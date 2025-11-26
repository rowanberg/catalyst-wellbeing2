import { useState, useEffect } from 'react'
import type { RankData } from '@/components/student/RankCard'

export function useStudentRank(studentId: string | undefined) {
  const [rankData, setRankData] = useState<RankData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) {
      setLoading(false)
      return
    }

    const fetchRankData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/student/rank?student_id=${studentId}`)

        if (!response.ok) {
          // Handle specific error codes gracefully
          if (response.status === 404 || response.status === 503) {
            // 404: Not found, 503: Service unavailable (offline mode)
            setError('Rank data not available yet. Check back after assessments.')
            return
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setRankData(data)
      } catch (err: any) {
        console.error('Error fetching rank data:', err)
        setError(err.message || 'Failed to load rank data')
      } finally {
        setLoading(false)
      }
    }

    fetchRankData()
  }, [studentId])

  return { rankData, loading, error }
}
