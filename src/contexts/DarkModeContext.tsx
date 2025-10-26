'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface DarkModeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const DarkModeContext = createContext<DarkModeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {}
})

export const useDarkMode = () => useContext(DarkModeContext)

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load dark mode preference from localStorage only on client
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('parentPortalDarkMode')
      if (savedMode === 'true') {
        setIsDarkMode(true)
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  const toggleDarkMode = () => {
    if (typeof window === 'undefined' || !mounted) return
    
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('parentPortalDarkMode', newMode.toString())
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Don't render until client-side to prevent SSR issues
  if (!mounted) {
    return (
      <DarkModeContext.Provider value={{ isDarkMode: false, toggleDarkMode: () => {} }}>
        {children}
      </DarkModeContext.Provider>
    )
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}
