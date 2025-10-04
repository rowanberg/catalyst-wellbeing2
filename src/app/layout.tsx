import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/redux/providers'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { HydrationProvider } from '@/components/providers/HydrationProvider'
import { AuthChecker } from '@/components/providers/AuthChecker'
import { RealtimeProvider } from '@/components/communications/RealtimeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Catalyst - School Well-being Platform',
  description: 'A holistic well-being platform for school ecosystems',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
              <AuthChecker>
                <RealtimeProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </RealtimeProvider>
              </AuthChecker>
            </Providers>
          </HydrationProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
