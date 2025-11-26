'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Award, Download, Users, Target, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRankCardPDF } from '@/hooks/useRankCardPDF'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface RankData {
  student_id: string
  first_name: string
  last_name: string
  school_id: string
  grade_level: string
  class_name?: string
  average_score: number
  total_assessments: number
  class_rank?: number
  total_students_in_class?: number
  grade_rank: number
  total_students_in_grade: number
  rank_change_class?: number
  rank_change_grade?: number
  last_updated: string
  percentile_class?: number
  percentile_grade: number
  performance_trend: 'improving' | 'declining' | 'stable'
}

interface RankCardProps {
  rankData: RankData
  type: 'class' | 'grade'
  className?: string
}

export const RankCard = ({ rankData, type = 'class', className }: RankCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { generatePDF } = useRankCardPDF()

  const isClassRank = type === 'class'
  const rank = isClassRank ? rankData.class_rank : rankData.grade_rank
  const totalStudents = isClassRank ? rankData.total_students_in_class : rankData.total_students_in_grade
  const percentile = isClassRank ? rankData.percentile_class : rankData.percentile_grade
  const rankChange = isClassRank ? rankData.rank_change_class : rankData.rank_change_grade

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true)
      toast.loading('Generating your Rank Card...')

      const result = await generatePDF(rankData)

      if (result.success) {
        toast.success(`Rank Card downloaded successfully: ${result.fileName}`)
      } else {
        toast.error(`Failed to generate PDF: ${result.error}`)
      }
    } catch (error) {
      toast.error('An error occurred while generating the PDF')
      console.error('PDF generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefreshRankings = async () => {
    try {
      setIsRefreshing(true)
      toast.loading('Refreshing rankings...')

      const response = await fetch('/api/student/rank/refresh', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Rankings updated! Please refresh the page to see latest data.')
        // Reload the page after a short delay
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error('Failed to refresh rankings')
      }
    } catch (error) {
      toast.error('An error occurred while refreshing rankings')
      console.error('Refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const [isVisible, setIsVisible] = useState(false)

  const timer = setTimeout(() => setIsVisible(true), 100)

  const getMedalColor = (rank: number | undefined) => {
    if (!rank) return null
    if (rank === 1) return 'from-yellow-400 to-amber-500'
    if (rank === 2) return 'from-gray-300 to-gray-400'
    if (rank === 3) return 'from-amber-600 to-orange-700'
    return null
  }

  const medalGradient = getMedalColor(rank)

  // Trend indicator
  const getTrendIcon = () => {
    if (!rankChange || rankChange === 0) return <Minus className="w-4 h-4" />
    if (rankChange > 0) return <TrendingUp className="w-4 h-4" />
    return <TrendingDown className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (!rankChange || rankChange === 0) return 'text-gray-400'
    if (rankChange > 0) return 'text-green-500'
    return 'text-red-500'
  }

  const getTrendText = () => {
    if (!rankChange || rankChange === 0) return 'No change'
    const absChange = Math.abs(rankChange)
    if (rankChange > 0) return `↑ ${absChange} ${absChange === 1 ? 'rank' : 'ranks'}`
    return `↓ ${absChange} ${absChange === 1 ? 'rank' : 'ranks'}`
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white border-2 shadow-sm p-4 sm:p-6',
        isClassRank
          ? 'border-indigo-100'
          : 'border-emerald-100',
        className
      )}
    >
      {/* Professional header stripe */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        isClassRank ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
      )} />

      {/* Header */}
      <div className="relative flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className={cn(
            'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            isClassRank ? 'bg-indigo-500' : 'bg-emerald-500'
          )}>
            {isClassRank ? (
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            ) : (
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">
              {isClassRank ? 'Academic Class Standing' : 'Grade-Level Academic Ranking'}
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-600 font-medium mt-0.5 truncate">
              {isClassRank
                ? `${rankData.class_name || 'N/A'} • Grade ${rankData.grade_level}`
                : `Grade ${rankData.grade_level} • Academic Year ${new Date().getFullYear()}`}
            </p>
          </div>
        </div>

        {/* Trend indicator */}
        {rankChange !== undefined && (
          <div
            className={cn(
              'flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex-shrink-0 border',
              rankChange > 0 ? 'bg-green-50 border-green-200 text-green-700' : rankChange < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'
            )}
          >
            <span>
              {getTrendIcon()}
            </span>
            <span className="hidden sm:inline">
              {getTrendText()}
            </span>
            <span className="sm:hidden">
              {rankChange > 0 ? `↑${Math.abs(rankChange)}` : rankChange < 0 ? `↓${Math.abs(rankChange)}` : '—'}
            </span>
          </div>
        )}
      </div>

      {/* Main rank display */}
      <div className="relative flex items-baseline gap-3 sm:gap-4 mb-4 sm:mb-5">
        {medalGradient ? (
          <div className="relative flex-shrink-0">
            <div className={cn(
              'w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md border-2 border-white',
              medalGradient
            )}>
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-md border-2 border-white flex-shrink-0',
              isClassRank
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            )}
          >
            {rank}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-gray-900">
              #{rank}
            </span>
            <span className="text-lg sm:text-xl text-gray-500 font-medium">
              of {totalStudents}
            </span>
          </div>

          {percentile !== undefined && (
            <div className="mt-2 sm:mt-3 space-y-1">
              <p className={cn(
                "text-sm sm:text-base font-bold",
                isClassRank ? "text-indigo-600" : "text-emerald-600"
              )}>
                Top {(100 - percentile).toFixed(1)}% Performer
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Outperforming {percentile?.toFixed(0)}% of students
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative pt-4 sm:pt-5 border-t-2 border-gray-100">
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Average Score</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {rankData.average_score.toFixed(1)}
              </p>
              <span className="text-sm sm:text-base text-gray-500 font-semibold">%</span>
            </div>
            <p className="text-xs text-gray-500">Overall performance</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Assessments</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {rankData.total_assessments}
              </p>
              <span className="text-sm sm:text-base text-gray-500 font-semibold">total</span>
            </div>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 sm:mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Percentile Ranking</span>
            <span className="text-sm sm:text-base font-bold text-gray-900">{percentile?.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              style={{ width: `${percentile}%` }}
              className={cn(
                'h-full rounded-full transition-all duration-1000',
                isClassRank
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              )}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
        {/* Refresh Rankings Button */}
        <Button
          onClick={handleRefreshRankings}
          disabled={isRefreshing}
          variant="outline"
          className="w-full gap-1.5 sm:gap-2 font-medium border-2 h-9 sm:h-10 text-xs sm:text-sm"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              <span className="hidden sm:inline">Updating Rankings...</span>
              <span className="sm:hidden">Updating...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Refresh Rankings (includes new assessments)</span>
              <span className="sm:hidden">Refresh Rankings</span>
            </>
          )}
        </Button>

        {/* Download PDF Button */}
        <Button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className={cn(
            'w-full gap-1.5 sm:gap-2 font-semibold shadow-lg transition-all duration-300 h-9 sm:h-10 text-xs sm:text-sm',
            isClassRank
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
          )}
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Download Official Certificate</span>
              <span className="sm:hidden">Download Certificate</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Skeleton loader for rank card
export function RankCardSkeleton({ type }: { type: 'class' | 'grade' }) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-6 animate-pulse',
      type === 'class'
        ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
        : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gray-300" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-gray-300 rounded" />
            <div className="w-16 h-3 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="w-16 h-6 bg-gray-300 rounded-lg" />
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <div className="w-16 h-16 rounded-full bg-gray-300" />
        <div className="space-y-2">
          <div className="w-32 h-8 bg-gray-300 rounded" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="space-y-2">
            <div className="w-20 h-3 bg-gray-200 rounded" />
            <div className="w-16 h-6 bg-gray-300 rounded" />
          </div>
          <div className="space-y-2">
            <div className="w-20 h-3 bg-gray-200 rounded" />
            <div className="w-16 h-6 bg-gray-300 rounded" />
          </div>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full" />
      </div>
    </div>
  )
}
