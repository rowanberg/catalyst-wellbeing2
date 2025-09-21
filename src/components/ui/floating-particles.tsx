'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
}

interface FloatingParticlesProps {
  count?: number
  colors?: string[]
  className?: string
}

export function FloatingParticles({ 
  count = 20, 
  colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
  className = ''
}: FloatingParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 10 + 10
    }))
  }, [count, colors.join(',')])

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-20"
          style={{
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
          }}
          initial={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
          }}
          animate={{
            x: [`${particle.x}%`, `${(particle.x + 20) % 100}%`, `${particle.x}%`],
            y: [`${particle.y}%`, `${(particle.y + 15) % 100}%`, `${particle.y}%`],
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
