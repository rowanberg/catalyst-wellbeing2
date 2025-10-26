'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

interface LuminexAvatarProps {
  size?: number
  animated?: boolean
}

export function LuminexAvatar({ size = 36, animated = true }: LuminexAvatarProps) {
  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Animated background glow */}
      {animated && (
        <>
          <div 
            className="absolute inset-0 rounded-full opacity-20 blur-md animate-pulse"
            style={{ 
              width: size + 8, 
              height: size + 8, 
              left: -4, 
              top: -4,
              background: 'linear-gradient(to bottom right, #cdb4db, #ffc8dd, #ffafcc)'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full opacity-10 blur-lg animate-pulse"
            style={{ 
              width: size + 16, 
              height: size + 16, 
              left: -8, 
              top: -8,
              background: 'linear-gradient(to top right, #bde0fe, #a2d2ff, #ffc8dd)',
              animationDelay: '0.5s'
            }}
          />
        </>
      )}
      
      {/* Main avatar circle with geometric pattern */}
      <div 
        className="relative rounded-full shadow-lg flex items-center justify-center overflow-hidden"
        style={{ 
          width: size, 
          height: size,
          background: 'linear-gradient(to bottom right, #cdb4db, #ffc8dd, #ffafcc)'
        }}
      >
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M6 0L9 3L6 6L3 3Z" fill="white" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>
        
        {/* Central icon with gradient */}
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative">
            <Sparkles 
              className="text-white drop-shadow-lg" 
              size={size * 0.5}
              strokeWidth={2.5}
            />
            {/* Animated sparkle effect */}
            {animated && (
              <>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-75" />
                <div 
                  className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-200 rounded-full animate-ping opacity-75" 
                  style={{ animationDelay: '0.3s' }}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Shine effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 50% 50%)'
          }}
        />
      </div>
    </div>
  )
}
