import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/redux/providers'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { HydrationProvider } from '@/components/providers/HydrationProvider'
import { RealtimeProvider } from '@/components/communications/RealtimeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Catalyst - School Well-being Platform',
  description: 'A holistic well-being platform for school ecosystems',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <HydrationProvider>
          <ErrorBoundary>
            <Providers>
              <RealtimeProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </RealtimeProvider>
            </Providers>
          </ErrorBoundary>
        </HydrationProvider>
      </body>
    </html>
  )
}
