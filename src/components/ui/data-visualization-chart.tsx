'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface DataPoint {
  label: string
  value: number
  color: string
}

interface DataVisualizationChartProps {
  data: DataPoint[]
  type?: 'bar' | 'donut' | 'line'
  className?: string
  animated?: boolean
}

export function DataVisualizationChart({ 
  data, 
  type = 'bar', 
  className = '',
  animated = true
}: DataVisualizationChartProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const maxValue = Math.max(...data.map(d => d.value))

  if (type === 'bar') {
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((item: any, index: number) => (
          <motion.div
            key={item.label}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
            transition={{ delay: animated ? index * 0.1 : 0, duration: 0.5 }}
          >
            <div className="w-16 text-sm font-medium text-gray-600 truncate">
              {item.label}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                animate={{ width: isVisible ? `${(item.value / maxValue) * 100}%` : 0 }}
                transition={{ 
                  delay: animated ? index * 0.1 + 0.3 : 0, 
                  duration: animated ? 1 : 0,
                  ease: "easeOut"
                }}
              />
            </div>
            <motion.div
              className="w-8 text-sm font-bold text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ delay: animated ? index * 0.1 + 0.8 : 0 }}
            >
              {item.value}
            </motion.div>
          </motion.div>
        ))}
      </div>
    )
  }

  if (type === 'donut') {
    const total = data.reduce((sum: number, item: any) => sum + item.value, 0)
    let cumulativePercentage = 0

    return (
      <div className={`relative ${className}`}>
        <svg width="120" height="120" className="transform -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          {data.map((item: any, index: number) => {
            const percentage = (item.value / total) * 100
            const strokeDasharray = `${percentage * 3.14} 314`
            const strokeDashoffset = -cumulativePercentage * 3.14
            cumulativePercentage += percentage

            return (
              <motion.circle
                key={item.label}
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={item.color}
                strokeWidth="10"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                initial={{ strokeDasharray: "0 314" }}
                animate={{ strokeDasharray: isVisible ? strokeDasharray : "0 314" }}
                transition={{ 
                  delay: animated ? index * 0.2 : 0, 
                  duration: animated ? 1.5 : 0,
                  ease: "easeOut"
                }}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.5 }}
            transition={{ delay: animated ? 0.5 : 0, duration: 0.5 }}
          >
            <div className="text-2xl font-bold text-gray-800">{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </motion.div>
        </div>
      </div>
    )
  }

  return null
}
