'use client'

import React from 'react'
import { User } from 'lucide-react'

interface UserAvatarProps {
  size?: number
  name?: string
  showInitials?: boolean
}

export function UserAvatar({ size = 36, name, showInitials = true }: UserAvatarProps) {
  const getInitials = (fullName?: string) => {
    if (!fullName) return 'U'
    const parts = fullName.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return fullName[0].toUpperCase()
  }

  const initials = getInitials(name)

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Subtle background glow */}
      <div 
        className="absolute inset-0 rounded-full opacity-20 blur-sm"
        style={{ 
          width: size + 4, 
          height: size + 4, 
          left: -2, 
          top: -2,
          background: 'linear-gradient(to bottom right, #bde0fe, #a2d2ff)'
        }}
      />
      
      {/* Main avatar circle */}
      <div 
        className="relative rounded-full shadow-md flex items-center justify-center overflow-hidden"
        style={{ 
          width: size, 
          height: size,
          background: 'linear-gradient(to bottom right, #bde0fe, #a2d2ff)'
        }}
      >
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {showInitials && name ? (
            <span 
              className="font-bold text-white tracking-tight"
              style={{ fontSize: size * 0.4 }}
            >
              {initials}
            </span>
          ) : (
            <User 
              className="text-white" 
              size={size * 0.5}
              strokeWidth={2.5}
            />
          )}
        </div>
        
        {/* Shine effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"
          style={{
            clipPath: 'polygon(0 0, 60% 0, 30% 30%)'
          }}
        />
      </div>
    </div>
  )
}
