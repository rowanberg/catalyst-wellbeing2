'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { GameLauncher } from '@/components/student/games/GameLauncher'

export function LearningGames({ onBack }: { onBack: () => void }) {
  const [isInGame, setIsInGame] = useState(false)

  const handleBackToLauncher = () => {
    setIsInGame(false)
  }

  const handleGameLaunch = () => {
    setIsInGame(true)
  }

  return (
    <div className="fixed inset-0 w-full h-full">
      {/* Game Launcher with all premium games */}
      <GameLauncher 
        hideBackButton={!isInGame} 
        onBackToLauncher={handleBackToLauncher}
        onGameLaunch={handleGameLaunch}
      />
    </div>
  )
}
