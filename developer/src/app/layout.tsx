import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'CatalystWells Developer Portal',
    description: 'Build amazing education apps with CatalystWells OAuth API',
    keywords: ['education', 'API', 'OAuth', 'developer', 'integration'],
    authors: [{ name: 'CatalystWells' }],
    creator: 'CatalystWells',
    publisher: 'CatalystWells',
    robots: 'index, follow',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://developers.catalystwells.com',
        title: 'CatalystWells Developer Portal',
        description: 'Build amazing education apps with CatalystWells OAuth API',
        siteName: 'CatalystWells Developer Portal',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'CatalystWells Developer Portal',
        description: 'Build amazing education apps with CatalystWells OAuth API',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    )
}
