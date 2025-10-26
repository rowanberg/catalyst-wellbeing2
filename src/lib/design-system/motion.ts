/**
 * Catalyst Wells Motion System
 * Standardized Framer Motion variants for consistency
 * 
 * Principles:
 * - All transitions 250-350ms
 * - GPU-accelerated (transform + opacity only)
 * - Purposeful, not decorative
 * - Spring physics for organic feel
 */

import { Variants, Transition } from 'framer-motion'

// Standard easing curves
export const easing = {
  smooth: [0.4, 0, 0.2, 1] as const,        // Material ease-out
  gentle: [0.4, 0, 0.6, 1] as const,        // Softer ease
  spring: [0.34, 1.56, 0.64, 1] as const,   // Subtle bounce
} as const

// Standard transition configurations
export const transitions = {
  fast: {
    duration: 0.15,
    ease: easing.smooth,
  },
  base: {
    duration: 0.25,
    ease: easing.smooth,
  },
  slow: {
    duration: 0.35,
    ease: easing.gentle,
  },
  spring: {
    type: 'spring' as const,
    damping: 25,
    stiffness: 300,
  },
  gentleSpring: {
    type: 'spring' as const,
    damping: 30,
    stiffness: 200,
  },
  tabChange: {
    duration: 0.3,
    ease: easing.smooth,
  },
} as const

// Reusable animation variants
export const motionVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: transitions.base,
  } satisfies Variants,

  fadeInUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: transitions.base,
  } satisfies Variants,

  fadeInDown: {
    initial: { opacity: 0, y: -12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 12 },
    transition: transitions.base,
  } satisfies Variants,

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: transitions.base,
  } satisfies Variants,

  scaleInCenter: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: transitions.spring,
  } satisfies Variants,

  // Slide animations
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: transitions.base,
  } satisfies Variants,

  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: transitions.base,
  } satisfies Variants,

  slideInBottom: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: transitions.base,
  } satisfies Variants,

  // Tab transitions (smooth page changes)
  tabTransition: {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.98 },
    transition: transitions.tabChange,
  } satisfies Variants,

  // Modal/Overlay animations
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: transitions.fast,
  } satisfies Variants,

  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: transitions.spring,
  } satisfies Variants,

  drawerSlideIn: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: transitions.gentleSpring,
  } satisfies Variants,

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  } satisfies Variants,

  staggerItem: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: transitions.base,
  } satisfies Variants,
} as const

// Hover/Tap interaction presets
export const interactions = {
  button: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: transitions.fast,
  },

  card: {
    whileHover: { y: -2, scale: 1.01 },
    transition: transitions.base,
  },

  iconButton: {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 },
    transition: transitions.fast,
  },

  subtle: {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
    transition: transitions.fast,
  },
} as const

// Layout animations
export const layoutTransitions = {
  smooth: {
    layout: true,
    transition: transitions.base,
  },
  spring: {
    layout: true,
    transition: transitions.spring,
  },
} as const

// Presence animations for AnimatePresence
export const presenceConfig = {
  mode: 'wait' as const,
  initial: false,
}

// Utility function to combine variants
export function combineVariants(...variants: Partial<Variants>[]): Variants {
  return Object.assign({}, ...variants)
}

// Export types
export type MotionVariant = keyof typeof motionVariants
export type InteractionType = keyof typeof interactions
