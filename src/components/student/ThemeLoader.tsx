'use client'

import { useEffect } from 'react'

// Theme definitions with exact color palettes
const THEMES = {
  'fiery-rose': {
    primary: '#F08080',
    secondary: '#F4978E',
    tertiary: '#FBC4AB',
    accent: '#F8AD9D',
    highlight: '#FFF5EE'
  },
  'ocean-sunset': {
    primary: '#000814',
    secondary: '#001d3d',
    tertiary: '#003566',
    accent: '#ffc300',
    highlight: '#ffd60a'
  },
  'fresh-meadow': {
    primary: '#22577a',
    secondary: '#38a3a5',
    tertiary: '#57cc99',
    accent: '#80ed99',
    highlight: '#c7f9cc'
  },
  'autumn-ember': {
    primary: '#ea8c55',
    secondary: '#c75146',
    tertiary: '#ad2e24',
    accent: '#81171b',
    highlight: '#540804'
  }
} as const

type ThemeName = keyof typeof THEMES

// Helper function to apply theme
function applyTheme(themeName: ThemeName) {
  const root = document.documentElement
  const colors = THEMES[themeName]
  
  root.style.setProperty('--theme-primary', colors.primary)
  root.style.setProperty('--theme-secondary', colors.secondary)
  root.style.setProperty('--theme-tertiary', colors.tertiary)
  root.style.setProperty('--theme-accent', colors.accent)
  root.style.setProperty('--theme-highlight', colors.highlight)
  
  console.log('✅ Theme applied:', themeName, colors)
}

// Apply theme immediately on module load (before React hydration)
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('catalyst-theme-preference') as ThemeName | null
  const theme = storedTheme && THEMES[storedTheme] ? storedTheme : 'fiery-rose'
  applyTheme(theme)
}

export function ThemeLoader() {
  useEffect(() => {
    // Re-apply theme on mount to ensure it's set
    const storedTheme = localStorage.getItem('catalyst-theme-preference') as ThemeName | null
    const theme = storedTheme && THEMES[storedTheme] ? storedTheme : 'fiery-rose'
    applyTheme(theme)
    
    // Listen for custom theme change events (for same-window changes)
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme as ThemeName
      if (THEMES[newTheme]) {
        applyTheme(newTheme)
      }
    }
    
    // Listen for storage events (for cross-window changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'catalyst-theme-preference' && e.newValue) {
        const newTheme = e.newValue as ThemeName
        if (THEMES[newTheme]) {
          applyTheme(newTheme)
        }
      }
    }
    
    window.addEventListener('themeChange', handleThemeChange as EventListener)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('themeChange', handleThemeChange as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  return null // This component doesn't render anything
}
