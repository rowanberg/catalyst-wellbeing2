/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable in Next.js 13+, no experimental flag needed
  
  // Suppress hydration warnings caused by browser extensions
  reactStrictMode: true,
  
  // ESLint configuration
  eslint: {
    // Enable linting during builds
    ignoreDuringBuilds: false,
    dirs: ['src']
  },
  
  // Disable static export to allow dynamic API routes
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Set the correct workspace root to silence lockfile warning
  outputFileTracingRoot: __dirname,
  
  // Custom headers including CSP
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
          },
        ],
      },
    ]
  },
  
  // Custom webpack configuration to handle hydration issues
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Suppress hydration warnings in development for form elements
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-dom$': 'react-dom/profiling',
        'scheduler/tracing': 'scheduler/tracing-profiling',
      }
    }
    
    // Handle Html import issues during build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    // Optimize for client components
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            client: {
              name: 'client-components',
              test: /[\\/]components[\\/]ui[\\/]/,
              chunks: 'all',
              priority: 10,
            },
          },
        },
      }
    }
    
    return config
  },
  
  // External packages for server components
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Optimize build for production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enable build caching for faster builds
  experimental: {
    // Optimize CSS
    optimizeCss: true,
    // Turbopack configuration (if needed)
    // turbo: {
    //   rules: {
    //     '*.svg': ['@svgr/webpack'],
    //   },
    // },
  },
}

module.exports = nextConfig
