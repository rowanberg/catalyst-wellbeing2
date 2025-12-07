import { Metadata } from 'next'
import WizardClient from './WizardClient'

export const metadata: Metadata = {
    title: 'School Registration Wizard | Catalyst Wells',
    description: 'Register your educational institution with Catalyst Wells. Secure, compliant, and enterprise-grade platform for student wellbeing and learning.',
    keywords: ['school registration', 'education platform', 'student wellbeing', 'learning management system', 'Catalyst Wells', 'edtech', 'school admin'],
    alternates: {
        canonical: 'https://www.catalystwells.com/register/wizard',
    },
    openGraph: {
        title: 'School Registration Wizard | Catalyst Wells',
        description: 'Join thousands of schools transforming education with Catalyst Wells. Secure, compliant, and enterprise-grade.',
        url: 'https://www.catalystwells.com/register/wizard',
        siteName: 'Catalyst Wells',
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'School Registration Wizard | Catalyst Wells',
        description: 'Register your educational institution with Catalyst Wells.',
    },
}

export default function RegisterWizardPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.catalystwells.com',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Register',
                item: 'https://www.catalystwells.com/register',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: 'Wizard',
                item: 'https://www.catalystwells.com/register/wizard',
            },
        ],
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <WizardClient />
        </>
    )
}
