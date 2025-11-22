'use client'

// Touch target optimization utilities for mobile-first design
export const TOUCH_TARGET_SIZE = 44 // Minimum touch target size in pixels (Apple/Google guidelines)

// Base touch target classes for consistent implementation
export const touchTargetClasses = {
  // Minimum touch target size
  base: `min-h-[${TOUCH_TARGET_SIZE}px] min-w-[${TOUCH_TARGET_SIZE}px]`,

  // Interactive feedback
  interactive: 'active:scale-95 transition-transform duration-150',

  // Touch action optimization
  manipulation: 'touch-manipulation',

  // Common button patterns
  button: {
    primary: `min-h-[${TOUCH_TARGET_SIZE}px] px-4 py-3 active:scale-95 transition-all duration-200`,
    secondary: `min-h-[${TOUCH_TARGET_SIZE}px] px-3 py-2 active:scale-95 transition-all duration-200`,
    icon: `min-h-[${TOUCH_TARGET_SIZE}px] min-w-[${TOUCH_TARGET_SIZE}px] p-2 active:scale-95 transition-all duration-200`,
    fab: `h-14 w-14 active:scale-90 transition-all duration-200`, // Floating action button
  },

  // Navigation patterns
  nav: {
    tab: `min-h-[${TOUCH_TARGET_SIZE}px] min-w-[${TOUCH_TARGET_SIZE}px] p-2 active:scale-95 transition-colors duration-200`,
    menu: `min-h-[${TOUCH_TARGET_SIZE}px] w-full px-4 py-3 active:scale-98 transition-all duration-200`,
  },

  // Form elements
  form: {
    input: `min-h-[${TOUCH_TARGET_SIZE}px] px-3 py-2`,
    checkbox: `h-5 w-5 min-h-[${TOUCH_TARGET_SIZE}px] min-w-[${TOUCH_TARGET_SIZE}px] p-2`,
    radio: `h-5 w-5 min-h-[${TOUCH_TARGET_SIZE}px] min-w-[${TOUCH_TARGET_SIZE}px] p-2`,
  },

  // Card interactions
  card: {
    clickable: `active:scale-98 transition-all duration-200 cursor-pointer`,
    hoverable: `hover:shadow-md transition-shadow duration-200`,
  }
}

// CSS-in-JS styles for dynamic applications
export const touchTargetStyles = {
  base: {
    minHeight: `${TOUCH_TARGET_SIZE}px`,
    minWidth: `${TOUCH_TARGET_SIZE}px`,
    touchAction: 'manipulation' as const,
  },

  interactive: {
    transition: 'transform 150ms ease-in-out',
    cursor: 'pointer',
  },

  activeScale: {
    transform: 'scale(0.95)',
  },

  button: {
    primary: {
      minHeight: `${TOUCH_TARGET_SIZE}px`,
      padding: '12px 16px',
      touchAction: 'manipulation' as const,
      transition: 'all 200ms ease-in-out',
    },

    icon: {
      minHeight: `${TOUCH_TARGET_SIZE}px`,
      minWidth: `${TOUCH_TARGET_SIZE}px`,
      padding: '8px',
      touchAction: 'manipulation' as const,
      transition: 'all 200ms ease-in-out',
    }
  }
}

// Utility functions for touch target validation
export const validateTouchTarget = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect()
  return rect.width >= TOUCH_TARGET_SIZE && rect.height >= TOUCH_TARGET_SIZE
}

export const getTouchTargetViolations = (container: HTMLElement): HTMLElement[] => {
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
  )

  const violations: HTMLElement[] = []

  interactiveElements.forEach((element) => {
    if (!validateTouchTarget(element as HTMLElement)) {
      violations.push(element as HTMLElement)
    }
  })

  return violations
}

// React hook for touch target optimization
export const useTouchTargetOptimization = (enabled: boolean = true) => {
  const checkTouchTargets = (containerRef: React.RefObject<HTMLElement>) => {
    if (!enabled || !containerRef.current) return []

    return getTouchTargetViolations(containerRef.current)
  }

  const logTouchTargetViolations = (containerRef: React.RefObject<HTMLElement>) => {
    const violations = checkTouchTargets(containerRef)

    if (violations.length > 0) {
      console.warn(`Found ${violations.length} touch target violations:`, violations)
      violations.forEach((element, index) => {
        const rect = element.getBoundingClientRect()
        console.warn(`Violation ${index + 1}:`, {
          element,
          size: `${rect.width}x${rect.height}`,
          required: `${TOUCH_TARGET_SIZE}x${TOUCH_TARGET_SIZE}`,
          tagName: element.tagName,
          className: element.className
        })
      })
    }

    return violations
  }

  return {
    checkTouchTargets,
    logTouchTargetViolations,
    TOUCH_TARGET_SIZE
  }
}

// Responsive touch target classes for different screen sizes
export const responsiveTouchTargets = {
  // Mobile-first approach
  mobile: {
    button: `min-h-[${TOUCH_TARGET_SIZE}px] px-4 py-3 text-base`,
    icon: `min-h-[${TOUCH_TARGET_SIZE}px] min-w-[${TOUCH_TARGET_SIZE}px] p-3`,
    nav: `min-h-[${TOUCH_TARGET_SIZE}px] px-3 py-2`,
  },

  // Tablet adjustments
  tablet: {
    button: `md:min-h-[40px] md:px-6 md:py-2 md:text-sm`,
    icon: `md:min-h-[40px] md:min-w-[40px] md:p-2`,
    nav: `md:min-h-[40px] md:px-4 md:py-2`,
  },

  // Desktop refinements
  desktop: {
    button: `lg:min-h-[36px] lg:px-4 lg:py-2 lg:text-sm`,
    icon: `lg:min-h-[36px] lg:min-w-[36px] lg:p-2`,
    nav: `lg:min-h-[36px] lg:px-3 lg:py-2`,
  }
}

// Combine responsive classes
export const getResponsiveTouchTarget = (type: 'button' | 'icon' | 'nav') => {
  return `${responsiveTouchTargets.mobile[type]} ${responsiveTouchTargets.tablet[type]} ${responsiveTouchTargets.desktop[type]}`
}

// Accessibility enhancements for touch targets
export const accessibilityEnhancements = {
  // ARIA attributes for better screen reader support
  button: {
    role: 'button',
    tabIndex: 0,
  },

  // Focus management
  focusable: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

  // High contrast mode support
  highContrast: 'border border-transparent hover:border-gray-300 dark:hover:border-gray-600',

  // Reduced motion support
  reducedMotion: 'motion-reduce:transition-none motion-reduce:transform-none',
}

// Performance optimizations for touch interactions
export const performanceOptimizations = {
  // Use transform instead of changing layout properties
  transform: 'transform: scale(0.95)',

  // Use will-change for smooth animations
  willChange: 'will-change-transform',

  // Use contain for better performance
  contain: 'contain: layout style paint',

  // Passive event listeners
  passive: { passive: true },
}

// Complete touch-optimized button component class generator
export const createTouchOptimizedButton = (
  variant: 'primary' | 'secondary' | 'icon' | 'nav' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
) => {
  const baseClasses = [
    touchTargetClasses.base,
    touchTargetClasses.interactive,
    accessibilityEnhancements.focusable,
    accessibilityEnhancements.reducedMotion,
    'select-none', // Prevent text selection
    'outline-none', // Remove default outline
  ]

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg',
    icon: 'rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400',
    nav: 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  }

  return [
    ...baseClasses,
    variantClasses[variant],
    sizeClasses[size]
  ].join(' ')
}

const TouchTargetOptimization = {
  touchTargetClasses,
  touchTargetStyles,
  validateTouchTarget,
  getTouchTargetViolations,
  useTouchTargetOptimization,
  responsiveTouchTargets,
  getResponsiveTouchTarget,
  accessibilityEnhancements,
  performanceOptimizations,
  createTouchOptimizedButton,
  TOUCH_TARGET_SIZE
}

export default TouchTargetOptimization
