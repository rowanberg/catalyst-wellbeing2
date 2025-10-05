'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatsWidgetProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  darkMode: boolean
}

export function StatsWidget({ title, value, icon: Icon, trend, darkMode }: StatsWidgetProps) {
  const isPositiveTrend = trend && trend.startsWith('+')
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl' 
          : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl'
      }`}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${
            darkMode ? 'bg-slate-700/50' : 'bg-gray-100/50'
          }`}>
            <Icon className={`w-6 h-6 ${
              darkMode ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              isPositiveTrend 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              <TrendIcon className="w-3 h-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </motion.div>
          
          <p className={`text-sm ${
            darkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            {title}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full translate-y-8 -translate-x-8" />
      </div>
    </motion.div>
  )
}
