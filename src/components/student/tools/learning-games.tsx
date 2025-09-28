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
    <div className="relative">
      {/* Back Button Overlay - show when not in a game */}
      {!isInGame && (
        <Button
          onClick={onBack}
          className="absolute top-3 left-3 z-50 bg-gray-900/90 hover:bg-gray-900 text-white backdrop-blur-sm border border-gray-600/50 shadow-lg"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Back to Community</span>
          <span className="sm:hidden">Back</span>
        </Button>
      )}
      
      {/* Back to Community Button - show when in a game */}
      {isInGame && (
        <Button
          onClick={onBack}
          className="absolute top-4 right-4 z-50 bg-red-900/80 hover:bg-red-900 text-white backdrop-blur-sm"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit to Community
        </Button>
      )}
      
      {/* Game Launcher with all premium games */}
      <GameLauncher 
        hideBackButton={!isInGame} 
        onBackToLauncher={handleBackToLauncher}
        onGameLaunch={handleGameLaunch}
      />
    </div>
  )
}
