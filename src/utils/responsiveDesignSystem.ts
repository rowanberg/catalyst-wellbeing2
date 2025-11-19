'use client'

// Comprehensive responsive design system for mobile-first approach
export const breakpoints = {
  xs: '320px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large screens
} as const

// Spacing system (mobile-first with responsive scaling)
export const spacing = {
  // Base mobile spacing
  mobile: {
    xs: 'p-1',      // 4px
    sm: 'p-2',      // 8px
    md: 'p-3',      // 12px
    lg: 'p-4',      // 16px
    xl: 'p-6',      // 24px
    '2xl': 'p-8',   // 32px
  },
  
  // Responsive scaling
  responsive: {
    xs: 'p-1 md:p-2',
    sm: 'p-2 md:p-3',
    md: 'p-3 lg:p-4',
    lg: 'p-4 lg:p-6',
    xl: 'p-6 lg:p-8',
    '2xl': 'p-8 lg:p-12',
  },
  
  // Container padding
  container: 'px-4 sm:px-6 lg:px-8',
  
  // Section spacing
  section: 'py-8 md:py-12 lg:py-16',
  
  // Component spacing
  component: 'space-y-4 md:space-y-6',
}

// Typography system (mobile-optimized)
export const typography = {
  // Headings (mobile-first)
  heading: {
    h1: 'text-2xl md:text-3xl lg:text-4xl font-bold leading-tight',
    h2: 'text-xl md:text-2xl lg:text-3xl font-semibold leading-tight',
    h3: 'text-lg md:text-xl lg:text-2xl font-semibold leading-snug',
    h4: 'text-base md:text-lg lg:text-xl font-medium leading-snug',
    h5: 'text-sm md:text-base lg:text-lg font-medium leading-normal',
    h6: 'text-xs md:text-sm lg:text-base font-medium leading-normal',
  },
  
  // Body text
  body: {
    large: 'text-base md:text-lg leading-relaxed',
    base: 'text-sm md:text-base leading-relaxed',
    small: 'text-xs md:text-sm leading-normal',
  },
  
  // UI text
  ui: {
    button: 'text-sm md:text-base font-medium',
    label: 'text-xs md:text-sm font-medium',
    caption: 'text-xs text-gray-600 dark:text-gray-400',
    code: 'text-xs md:text-sm font-mono',
  },
  
  // Reading optimized
  reading: {
    title: 'text-xl md:text-2xl lg:text-3xl font-bold leading-tight tracking-tight',
    subtitle: 'text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed',
    paragraph: 'text-sm md:text-base lg:text-lg leading-relaxed text-gray-800 dark:text-gray-200',
  }
}

// Layout patterns (mobile-first grid systems)
export const layout = {
  // Grid systems
  grid: {
    // Cards/items
    cards: {
      mobile: 'grid grid-cols-1 gap-4',
      tablet: 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6',
      desktop: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6',
    },
    
    // Dashboard metrics
    metrics: {
      mobile: 'grid grid-cols-2 gap-3',
      tablet: 'grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4',
      desktop: 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4',
    },
    
    // Form layouts
    form: {
      single: 'grid grid-cols-1 gap-4 md:gap-6',
      double: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
      triple: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
    },
  },
  
  // Flexbox patterns
  flex: {
    // Stack (vertical)
    stack: 'flex flex-col space-y-3 md:space-y-4',
    
    // Inline (horizontal)
    inline: 'flex flex-col sm:flex-row gap-3 md:gap-4',
    
    // Between (space-between)
    between: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4',
    
    // Center
    center: 'flex flex-col items-center justify-center text-center',
    
    // Wrap
    wrap: 'flex flex-wrap gap-2 md:gap-3',
  },
  
  // Container patterns
  container: {
    // Page containers
    page: 'min-h-screen bg-gray-50 dark:bg-gray-950',
    content: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
    
    // Card containers
    card: 'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm',
    panel: 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg',
  }
}

// Component sizing (mobile-optimized)
export const sizing = {
  // Button sizes
  button: {
    xs: 'px-2 py-1 text-xs min-h-[32px]',
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm md:text-base min-h-[40px] md:min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[44px] md:min-h-[48px]',
    xl: 'px-8 py-4 text-lg min-h-[48px] md:min-h-[52px]',
  },
  
  // Input sizes
  input: {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-3 py-2 text-sm md:text-base min-h-[40px] md:min-h-[44px]',
    lg: 'px-4 py-3 text-base min-h-[44px] md:min-h-[48px]',
  },
  
  // Icon sizes
  icon: {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10',
  },
  
  // Avatar sizes
  avatar: {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-20 w-20',
  }
}

// Interactive states (mobile-optimized)
export const interactions = {
  // Hover states (desktop only)
  hover: {
    card: 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200',
    button: 'hover:bg-opacity-90 transition-colors duration-200',
    link: 'hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200',
  },
  
  // Active states (mobile-friendly)
  active: {
    scale: 'active:scale-95 transition-transform duration-150',
    press: 'active:bg-gray-100 dark:active:bg-gray-800 transition-colors duration-150',
    button: 'active:scale-95 active:bg-opacity-80 transition-all duration-150',
  },
  
  // Focus states (accessibility)
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
  },
  
  // Disabled states
  disabled: {
    opacity: 'disabled:opacity-50 disabled:cursor-not-allowed',
    grayscale: 'disabled:grayscale disabled:cursor-not-allowed',
  }
}

// Animation system (performance-optimized)
export const animations = {
  // Transitions
  transition: {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-200 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
  },
  
  // Transforms
  transform: {
    scale: 'transform transition-transform duration-200 ease-in-out',
    rotate: 'transform transition-transform duration-300 ease-in-out',
  },
  
  // Fade effects
  fade: {
    in: 'animate-in fade-in duration-200',
    out: 'animate-out fade-out duration-200',
  },
  
  // Slide effects
  slide: {
    up: 'animate-in slide-in-from-bottom-4 duration-300',
    down: 'animate-in slide-in-from-top-4 duration-300',
    left: 'animate-in slide-in-from-right-4 duration-300',
    right: 'animate-in slide-in-from-left-4 duration-300',
  },
  
  // Loading states
  loading: {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
  }
}

// Utility functions for responsive design
export const responsive = {
  // Get responsive classes
  getSpacing: (size: keyof typeof spacing.responsive) => spacing.responsive[size],
  getTypography: (type: keyof typeof typography.heading) => typography.heading[type],
  getGrid: (type: keyof typeof layout.grid.cards) => layout.grid.cards[type],
  
  // Breakpoint utilities
  isMobile: () => typeof window !== 'undefined' && window.innerWidth < 768,
  isTablet: () => typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: () => typeof window !== 'undefined' && window.innerWidth >= 1024,
  
  // Dynamic class generation
  createResponsiveClass: (
    mobile: string,
    tablet?: string,
    desktop?: string
  ) => {
    let classes = mobile
    if (tablet) classes += ` md:${tablet}`
    if (desktop) classes += ` lg:${desktop}`
    return classes
  }
}

// Component composition utilities
export const compose = {
  // Card component classes
  card: (variant: 'default' | 'elevated' | 'outlined' = 'default') => {
    const base = layout.container.card
    const variants = {
      default: '',
      elevated: 'shadow-lg hover:shadow-xl transition-shadow duration-200',
      outlined: 'border-2'
    }
    return `${base} ${variants[variant]} ${spacing.responsive.md}`
  },
  
  // Button component classes
  button: (
    variant: 'primary' | 'secondary' | 'outline' = 'primary',
    size: keyof typeof sizing.button = 'md'
  ) => {
    const base = sizing.button[size]
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm',
      secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg',
      outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg'
    }
    return `${base} ${variants[variant]} ${interactions.active.button} ${interactions.focus.ring}`
  },
  
  // Input component classes
  input: (size: keyof typeof sizing.input = 'md', error: boolean = false) => {
    const base = sizing.input[size]
    const state = error 
      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
    
    return `${base} ${state} ${interactions.focus.ring} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg transition-colors duration-200`
  }
}

// Performance optimizations
export const performance = {
  // GPU acceleration
  gpu: 'transform-gpu',
  
  // Will-change optimization
  willChange: {
    transform: 'will-change-transform',
    scroll: 'will-change-scroll',
    auto: 'will-change-auto',
  },
  
  // Contain optimization
  contain: {
    layout: 'contain-layout',
    style: 'contain-style',
    paint: 'contain-paint',
    strict: 'contain-strict',
  },
  
  // Reduced motion support
  reducedMotion: 'motion-reduce:transition-none motion-reduce:animate-none',
}

// Export complete design system
export default {
  breakpoints,
  spacing,
  typography,
  layout,
  sizing,
  interactions,
  animations,
  responsive,
  compose,
  performance
}
