import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/redux/providers'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { HydrationProvider } from '@/components/providers/HydrationProvider'
import { AuthChecker } from '@/components/providers/AuthChecker'
import { RealtimeProvider } from '@/components/communications/RealtimeProvider'
import { PWAUpdateBanner, OfflineIndicator } from '@/components/ui/pwa-install-prompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Catalyst - School Well-being Platform',
  description: 'A holistic well-being platform for school ecosystems',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Catalyst',
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/logo.png'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Catalyst" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var observer=new MutationObserver(function(mutations){mutations.forEach(function(mutation){if(mutation.type==='attributes'&&mutation.attributeName==='bis_skin_checked'){mutation.target.removeAttribute('bis_skin_checked');}});});if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){observer.observe(document.body,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked']});});}else{observer.observe(document.body,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked']});}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <HydrationProvider>
            <Providers>
              <ToastProvider>
                <AuthChecker>
                  <RealtimeProvider>
                    {children}
                    <PWAUpdateBanner />
                    <OfflineIndicator />
                  </RealtimeProvider>
                </AuthChecker>
              </ToastProvider>
            </Providers>
          </HydrationProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
