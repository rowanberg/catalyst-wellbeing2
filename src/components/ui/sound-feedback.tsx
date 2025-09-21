'use client'

import { useEffect, useRef } from 'react'

interface SoundFeedbackProps {
  trigger: boolean
  soundType?: 'success' | 'notification' | 'warning' | 'error' | 'click' | 'hover'
  volume?: number
}

export function SoundFeedback({ 
  trigger, 
  soundType = 'click', 
  volume = 0.3 
}: SoundFeedbackProps) {
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    // Initialize Web Audio API context
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  const playSound = (type: string) => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Configure sound based on type
    switch (type) {
      case 'success':
        // Pleasant ascending chord
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2) // G5
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        break

      case 'notification':
        // Gentle bell-like sound
        oscillator.frequency.setValueAtTime(800, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3)
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        break

      case 'warning':
        // Attention-grabbing tone
        oscillator.frequency.setValueAtTime(440, ctx.currentTime)
        oscillator.frequency.setValueAtTime(554.37, ctx.currentTime + 0.15)
        oscillator.type = 'triangle'
        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
        break

      case 'error':
        // Low, concerning tone
        oscillator.frequency.setValueAtTime(220, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3)
        oscillator.type = 'sawtooth'
        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        break

      case 'click':
        // Short, crisp click
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime)
        oscillator.type = 'square'
        gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        break

      case 'hover':
        // Subtle hover sound
        oscillator.frequency.setValueAtTime(600, ctx.currentTime)
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        break
    }

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  }

  useEffect(() => {
    if (trigger) {
      playSound(soundType)
    }
  }, [trigger, soundType])

  return null // This component doesn't render anything
}

// Hook for easy sound integration
export function useSoundFeedback() {
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  const playSound = (soundType: 'success' | 'notification' | 'warning' | 'error' | 'click' | 'hover', volume = 0.3) => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Same sound configuration as above
    switch (soundType) {
      case 'success':
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime)
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        break

      case 'notification':
        oscillator.frequency.setValueAtTime(800, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3)
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        break

      case 'click':
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime)
        oscillator.type = 'square'
        gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        break

      default:
        oscillator.frequency.setValueAtTime(600, ctx.currentTime)
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    }

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  }

  return { playSound }
}
