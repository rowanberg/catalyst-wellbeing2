'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface RealTimeCounterProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}

export function RealTimeCounter({ 
  value, 
  duration = 1.5, 
  className = '',
  prefix = '',
  suffix = ''
}: RealTimeCounterProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (current) => Math.round(current))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return (
    <motion.span 
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  )
}
