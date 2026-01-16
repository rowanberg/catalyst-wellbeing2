import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/redux/providers'
import { ToastProvider } from '@/components/ui/toast'
import { HydrationProvider } from '@/components/providers/HydrationProvider'
import { AuthChecker } from '@/components/providers/AuthChecker'
import { RealtimeProvider } from '@/components/communications/RealtimeProvider'
import { OfflineIndicator } from '@/components/ui/pwa-install-prompt'
import { AnalyticsProvider, ServiceWorkerProvider } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800']
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '700']
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'),
  title: {
    default: 'Catalyst | Student Wellbeing & Academic Tracking Platform',
    template: '%s | Catalyst Wellbeing Platform'
  },
  description: 'Empower students with comprehensive wellbeing tracking, academic analytics, mental health support, and AI-powered homework help. The complete school ecosystem platform for students, teachers, and parents.',
  keywords: [
    'student wellbeing',
    'academic tracking',
    'mental health support',
    'school management',
    'education platform',
    'student analytics',
    'AI homework help',
    'parent portal',
    'teacher dashboard',
    'attendance tracking',
    'grade analytics',
    'emotional wellbeing',
    'school ecosystem'
  ],
  authors: [{ name: 'Catalyst Wellbeing Platform' }],
  creator: 'Catalyst Wellbeing Platform',
  publisher: 'Catalyst Wellbeing Platform',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Catalyst',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
      { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/logo.png'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Catalyst Wellbeing Platform',
    title: 'Catalyst | Student Wellbeing & Academic Tracking Platform',
    description: 'Empower students with comprehensive wellbeing tracking, academic analytics, and mental health support. The complete school ecosystem platform.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Catalyst Wellbeing Platform - Student Success & Mental Health',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catalyst | Student Wellbeing & Academic Tracking',
    description: 'Empower students with comprehensive wellbeing tracking, academic analytics, and mental health support.',
    images: ['/twitter-image.png'],
    creator: '@CatalystEdu',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Enable user zoom
  viewportFit: 'cover', // Enable full-screen on notched devices
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' }
  ],
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

        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://catalystwells.in/#organization',
                  name: 'Catalyst Wellbeing Platform',
                  url: 'https://catalystwells.in',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://catalystwells.in/logo.png',
                    width: 512,
                    height: 512
                  },
                  description: 'Comprehensive student wellbeing and academic tracking platform',
                  sameAs: [
                    'https://twitter.com/CatalystEdu',
                    'https://www.linkedin.com/company/catalyst-wellbeing',
                    'https://www.facebook.com/CatalystWellbeing'
                  ]
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://catalystwells.in/#website',
                  url: 'https://catalystwells.in',
                  name: 'Catalyst Wellbeing Platform',
                  description: 'Student wellbeing and academic tracking platform for schools',
                  publisher: {
                    '@id': 'https://catalystwells.in/#organization'
                  },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: 'https://catalystwells.in/search?q={search_term_string}'
                    },
                    'query-input': 'required name=search_term_string'
                  }
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://catalystwells.in/#software',
                  name: 'Catalyst Wellbeing Platform',
                  applicationCategory: 'EducationalApplication',
                  operatingSystem: 'Web, iOS, Android',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD'
                  },
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.8',
                    ratingCount: '1250',
                    bestRating: '5',
                    worstRating: '1'
                  },
                  featureList: [
                    'Student wellbeing tracking',
                    'Academic analytics',
                    'Mental health support',
                    'AI homework helper',
                    'Parent portal',
                    'Teacher dashboard',
                    'Attendance tracking',
                    'Grade analytics',
                    'Emotional wellbeing monitoring',
                    'Real-time notifications'
                  ],
                  screenshot: 'https://catalystwells.in/screenshot.png',
                  description: 'Comprehensive platform empowering students with wellbeing tracking, academic analytics, mental health support, and AI-powered homework help.',
                  url: 'https://catalystwells.in'
                },
                {
                  '@type': 'EducationalOrganization',
                  '@id': 'https://catalystwells.in/#edu-org',
                  name: 'Catalyst Wellbeing Platform',
                  description: 'Platform serving schools with comprehensive student wellbeing and academic tracking solutions',
                  address: {
                    '@type': 'PostalAddress',
                    addressCountry: 'US'
                  }
                }
              ]
            })
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize performance monitoring and analytics
              (function(){
                try {
                  // BiS skin checked removal
                  var observer=new MutationObserver(function(mutations){
                    mutations.forEach(function(mutation){
                      if(mutation.type==='attributes'&&mutation.attributeName==='bis_skin_checked'){
                        mutation.target.removeAttribute('bis_skin_checked');
                      }
                    });
                  });
                  
                  if(document.readyState==='loading'){
                    document.addEventListener('DOMContentLoaded',function(){
                      observer.observe(document.body,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked']});
                    });
                  } else {
                    observer.observe(document.body,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked']});
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${plusJakartaSans.variable} ${dmSans.variable}`} suppressHydrationWarning>
        <HydrationProvider>
          <Providers>
            <ServiceWorkerProvider>
              <AnalyticsProvider>
                <ToastProvider>
                  <AuthChecker>
                    <RealtimeProvider>
                      {children}
                      <OfflineIndicator />
                    </RealtimeProvider>
                  </AuthChecker>
                </ToastProvider>
              </AnalyticsProvider>
            </ServiceWorkerProvider>
          </Providers>
        </HydrationProvider>
      </body>
    </html>
  )
}
