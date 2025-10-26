/**
 * Catalyst Wells Design System - Design Tokens
 * Microsoft Copilot-level visual refinement
 * 
 * Philosophy:
 * - Calm, professional, educational
 * - Minimal blur, maximum clarity
 * - Single accent color for focus
 * - Consistent spatial rhythm
 */

export const designTokens = {
  // Color Palette - Neutral with single accent
  colors: {
    // Base colors
    base: {
      light: '#f8f8f8',
      dark: '#0f0f0f',
    },
    
    // Accent - Primary blue for focus
    accent: {
      DEFAULT: '#2563eb', // blue-600
      light: '#3b82f6',   // blue-500
      dark: '#1d4ed8',    // blue-700
      subtle: '#dbeafe',  // blue-50
    },
    
    // Semantic colors
    semantic: {
      success: '#10b981',  // emerald-500
      warning: '#f59e0b',  // amber-500
      error: '#ef4444',    // red-500
      info: '#06b6d4',     // cyan-500
    },
    
    // Neutrals - Slate family for professionalism
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },
  
  // Spacing - 8px base unit for consistent rhythm
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // Border Radius - Consistent roundness
  radius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    full: '9999px',
  },
  
  // Shadows - Subtle elevation
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Transitions - Consistent timing
  transitions: {
    fast: '150ms',
    base: '250ms',
    slow: '350ms',
    
    // Easing curves
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-out
      smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',  // custom smooth
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // bounce
    },
  },
  
  // Typography - Clear hierarchy
  typography: {
    fonts: {
      sans: 'var(--font-geist-sans)',
      mono: 'var(--font-geist-mono)',
    },
    
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  // Opacity levels - Subtle translucency
  opacity: {
    subtle: '0.05',    // For very mild backgrounds
    light: '0.1',      // For hover states
    medium: '0.2',     // For active states
    strong: '0.8',     // For overlays
    intense: '0.95',   // For modals
  },
  
  // Z-index layers - Consistent stacking
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    overlay: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },
} as const

// Type exports for TypeScript support
export type DesignTokens = typeof designTokens
export type ColorToken = keyof typeof designTokens.colors
export type SpacingToken = keyof typeof designTokens.spacing
export type RadiusToken = keyof typeof designTokens.radius
