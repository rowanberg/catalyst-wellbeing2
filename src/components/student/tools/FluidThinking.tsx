'use client'

import React, { useEffect, useRef } from 'react'

interface FluidThinkingProps {
  size?: number
}

export function FluidThinking({ size = 28 }: FluidThinkingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    let animationId: number
    let time = 0

    const colors = [
      { r: 99, g: 102, b: 241 },   // Indigo
      { r: 168, g: 85, b: 247 },   // Purple
      { r: 236, g: 72, b: 153 },   // Pink
    ]

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      color: typeof colors[0]
    }> = []

    // Create more particles for richer effect
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: Math.random() * size,
        y: Math.random() * size,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 3 + 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    function animate() {
      if (!ctx || !canvas) return

      time += 0.016
      ctx.clearRect(0, 0, size, size)

      // Update and draw particles with enhanced fluid motion
      particles.forEach((particle, i) => {
        // Multi-layered sine wave motion for ultra-smooth organic movement
        const wave1 = Math.sin(time * 1.5 + i * 0.5) * 0.4
        const wave2 = Math.cos(time * 0.8 + i * 0.3) * 0.3
        const wave3 = Math.sin(time * 2.0 + i) * 0.2
        
        particle.x += particle.vx + wave1 + wave3
        particle.y += particle.vy + wave2 + wave3

        // Smooth bounce with damping
        if (particle.x < particle.radius || particle.x > size - particle.radius) {
          particle.vx *= -0.95
          particle.x = Math.max(particle.radius, Math.min(size - particle.radius, particle.x))
        }
        if (particle.y < particle.radius || particle.y > size - particle.radius) {
          particle.vy *= -0.95
          particle.y = Math.max(particle.radius, Math.min(size - particle.radius, particle.y))
        }

        // Draw particle with enhanced gradient and glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 2.5
        )
        
        // Pulsing alpha with smooth wave
        const alpha = 0.5 + Math.sin(time * 2 + i * 0.7) * 0.25
        gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`)
        gradient.addColorStop(0.4, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.6})`)
        gradient.addColorStop(0.7, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.3})`)
        gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius * 2.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw connecting lines with enhanced metaball effect
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < size * 0.6) {
            // Smoother alpha falloff
            const normalizedDist = distance / (size * 0.6)
            const alpha = (1 - normalizedDist) * (1 - normalizedDist) * 0.2
            
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
            gradient.addColorStop(0, `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${alpha})`)
            gradient.addColorStop(0.5, `rgba(${(p1.color.r + p2.color.r) / 2}, ${(p1.color.g + p2.color.g) / 2}, ${(p1.color.b + p2.color.b) / 2}, ${alpha * 1.2})`)
            gradient.addColorStop(1, `rgba(${p2.color.r}, ${p2.color.g}, ${p2.color.b}, ${alpha})`)

            ctx.strokeStyle = gradient
            ctx.lineWidth = 1.5 + (1 - normalizedDist) * 0.5
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded-full"
    />
  )
}
