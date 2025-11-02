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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br p-6',
        isClassRank 
          ? 'from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/50'
          : 'from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/50',
        className
      )}
    >
      {/* Animated gradient background orb */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30"
        style={{
          background: isClassRank 
            ? 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)'
            : 'linear-gradient(135deg, #34d399 0%, #06b6d4 100%)'
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isClassRank ? 'bg-indigo-500' : 'bg-emerald-500'
          )}>
            {isClassRank ? (
              <Users className="w-5 h-5 text-white" />
            ) : (
              <Award className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              {isClassRank ? 'Academic Class Standing' : 'Grade-Level Academic Ranking'}
            </h3>
            <p className="text-xs text-gray-600 font-medium">
              {isClassRank 
                ? `${rankData.class_name || 'N/A'} • Grade ${rankData.grade_level}`
                : `Grade ${rankData.grade_level} • Academic Year ${new Date().getFullYear()}`}
            </p>
          </div>
        </div>

        {/* Trend indicator */}
        {rankChange !== undefined && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
              rankChange > 0 ? 'bg-green-100' : rankChange < 0 ? 'bg-red-100' : 'bg-gray-100'
            )}
          >
            <span className={getTrendColor()}>
              {getTrendIcon()}
            </span>
            <span className={getTrendColor()}>
              {getTrendText()}
            </span>
          </motion.div>
        )}
      </div>

      {/* Main rank display */}
      <div className="relative flex items-baseline gap-3 mb-4">
        {medalGradient ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
            className="relative"
          >
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg',
              medalGradient
            )}>
              <Trophy className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-md"
              style={{ background: `linear-gradient(135deg, ${medalGradient})` }}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg',
              isClassRank 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            )}
          >
            {rank}
          </motion.div>
        )}

        <div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-baseline gap-2"
          >
            <span className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              #{rank}
            </span>
            <span className="text-lg text-gray-500">
              of {totalStudents}
            </span>
          </motion.div>
          
          {percentile !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-1 space-y-0.5"
            >
              <p className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Top {(100 - percentile).toFixed(1)}% Performer
              </p>
              <p className="text-xs text-gray-500">
                Outperforming {percentile?.toFixed(0)}% of peers
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative pt-4 border-t border-gray-200"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Cumulative Average</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-gray-900">
                {rankData.average_score.toFixed(1)}
              </p>
              <span className="text-sm text-gray-500 font-medium">%</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Overall academic performance</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Evaluations</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-gray-900">
                {rankData.total_assessments}
              </p>
              <span className="text-sm text-gray-500 font-medium">taken</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Assessments completed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentile}%` }}
              transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                isClassRank
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600'
              )}
            />
          </div>
          <p className="text-xs font-medium text-gray-600 mt-1.5 text-right">
            <span className="text-gray-900">{percentile?.toFixed(1)}</span>th Percentile Ranking
          </p>
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-10">
        <Target className="w-20 h-20 text-gray-900" />
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-4 space-y-2"
      >
        {/* Refresh Rankings Button */}
        <Button
          onClick={handleRefreshRankings}
          disabled={isRefreshing}
          variant="outline"
          className="w-full gap-2 font-medium border-2"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Updating Rankings...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Rankings (includes new assessments)</span>
            </>
          )}
        </Button>

        {/* Download PDF Button */}
        <Button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className={cn(
            'w-full gap-2 font-semibold shadow-lg transition-all duration-300',
            isClassRank
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
          )}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Official Certificate</span>
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
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
