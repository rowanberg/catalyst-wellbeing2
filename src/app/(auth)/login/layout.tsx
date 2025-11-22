/**
 * ============================================================================
 * Login Layout - NO AUTH CHECKS
 * ============================================================================
 * This layout prevents auth checks on login page to avoid:
 * - Unnecessary /api/auth/session calls
 * - Double loading screens
 * - Performance overhead
 * ============================================================================
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Access Your Catalyst Dashboard',
  description: 'Sign in to Catalyst to access your personalized student wellbeing dashboard, grades, AI homework help, and connect with your school community. Secure access for students, parents, teachers, and administrators.',
  keywords: ['catalyst login', 'student portal login', 'school login', 'education platform sign in', 'student dashboard access'],
  openGraph: {
    title: 'Login | Access Your Catalyst Dashboard',
    description: 'Sign in to access your personalized dashboard with wellbeing tracking, grades, and AI-powered tools.',
    type: 'website',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // NO auth checks here - this is a public route
  return <>{children}</>
}
