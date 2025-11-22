/**
 * ============================================================================
 * Register Layout - WITH SEO METADATA
 * ============================================================================
 * Adds comprehensive SEO metadata for registration page
 * ============================================================================
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Register | Join Catalyst Wellbeing Platform',
    description: 'Create your Catalyst account to access AI-powered homework help, grade analytics, wellbeing tracking, and connect with your school. Free registration for students, parents, teachers, and administrators.',
    keywords: ['catalyst register', 'student registration', 'school signup', 'education platform join', 'create student account', 'parent portal signup'],
    openGraph: {
        title: 'Register | Join Catalyst Wellbeing Platform',
        description: 'Create your account to access AI-powered learning tools, wellbeing tracking, and your personalized dashboard.',
        type: 'website',
    },
}

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // NO auth checks here - this is a public route
    return <>{children}</>
}
