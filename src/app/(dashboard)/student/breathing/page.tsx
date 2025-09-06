'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, RotateCcw, Home } from 'lucide-react'
import { useAppDispatch } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'

export default function BreathingExercise() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [seconds, setSeconds] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  const phaseDurations = {
    inhale: 4,
    hold: 4,
    exhale: 6
  }

  const totalCycles = 5

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && !isCompleted) {
      interval = setInterval(() => {
        setSeconds(seconds => {
          const nextSecond = seconds + 1
          const currentPhaseDuration = phaseDurations[phase]

          if (nextSecond >= currentPhaseDuration) {
            // Move to next phase
            if (phase === 'inhale') {
              setPhase('hold')
            } else if (phase === 'hold') {
              setPhase('exhale')
            } else if (phase === 'exhale') {
              setPhase('inhale')
              setCycle(prev => {
                const nextCycle = prev + 1
                if (nextCycle >= totalCycles) {
                  setIsCompleted(true)
                  setIsActive(false)
                  // Award XP and gems
                  dispatch(updateXP(10))
                  dispatch(updateGems(2))
                }
                return nextCycle
              })
            }
            return 0
          }
          return nextSecond
        })
      }, 1000)
    } else if (!isActive) {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, phase, isCompleted, dispatch])

  const handleStart = () => {
    setIsActive(true)
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleReset = () => {
    setIsActive(false)
    setPhase('inhale')
    setSeconds(0)
    setCycle(0)
    setIsCompleted(false)
  }

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In'
      case 'hold':
        return 'Hold'
      case 'exhale':
        return 'Breathe Out'
    }
  }

  const getCircleScale = () => {
    const progress = seconds / phaseDurations[phase]
    if (phase === 'inhale') {
      return 0.5 + (progress * 0.5) // Scale from 0.5 to 1
    } else if (phase === 'exhale') {
      return 1 - (progress * 0.5) // Scale from 1 to 0.5
    }
    return 1 // Hold phase stays at full scale
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Well Done!</CardTitle>
            <CardDescription>You've completed your breathing exercise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-6xl">🌟</div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">Rewards Earned:</p>
              <div className="flex justify-center space-x-4">
                <div className="bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-blue-600 font-medium">+10 XP</span>
                </div>
                <div className="bg-purple-100 px-3 py-1 rounded-full">
                  <span className="text-purple-600 font-medium">+2 Gems</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={() => router.push('/student')} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Do Another Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Breathing Exercise</h1>
              <p className="text-gray-600">Take a moment to center yourself</p>
            </div>
            <Button onClick={() => router.push('/student')} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>4-4-6 Breathing Pattern</CardTitle>
            <CardDescription>
              Inhale for 4 seconds, hold for 4 seconds, exhale for 6 seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-8">
            {/* Progress */}
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Cycle {cycle + 1} of {totalCycles}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((cycle) / totalCycles) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Breathing Circle */}
            <div className="flex items-center justify-center">
              <div 
                className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xl transition-transform duration-1000 ease-in-out"
                style={{ 
                  transform: `scale(${getCircleScale()})`,
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
                }}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{getPhaseInstruction()}</div>
                  <div className="text-lg">{phaseDurations[phase] - seconds}</div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-800">
                {getPhaseInstruction()}
              </p>
              <p className="text-sm text-gray-600">
                Follow the circle and breathe at your own comfortable pace
              </p>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {!isActive ? (
                <Button onClick={handleStart} size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Start
                </Button>
              ) : (
                <Button onClick={handlePause} size="lg" variant="outline">
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={handleReset} size="lg" variant="outline">
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h4 className="font-semibold text-blue-800 mb-2">Tips for Success:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Find a comfortable seated position</li>
                <li>• Close your eyes if it helps you focus</li>
                <li>• Don't worry if your mind wanders - just return to your breath</li>
                <li>• Breathe through your nose if possible</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
