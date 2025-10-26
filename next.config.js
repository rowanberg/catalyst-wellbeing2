/** @type {import('next').NextConfig} */
// Optional bundle analyzer - only load if package is installed
let withBundleAnalyzer
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
} catch {
  // @next/bundle-analyzer not installed, use identity function
  withBundleAnalyzer = (config) => config
}

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
  
  // Static export DISABLED - Capacitor uses live backend URL instead
  // APK loads from https://catalystwells.netlify.app (configured in capacitor.config.ts)
  // output: 'export',
  // trailingSlash removed - was causing 404 on API routes
  images: {
    unoptimized: true
  },
  
  // Set the correct workspace root to silence lockfile warning
  outputFileTracingRoot: __dirname,
  
  // Custom headers including CSP - now handled by middleware.ts for better control
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods', 
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
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
    
    // Prevent chunk corruption with streaming routes during dev hot reload
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    
    // Optimize for client components in production
    if (!isServer && !dev) {
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
  
  // Skip static generation for dynamic admin pages
  async redirects() {
    return []
  },
  
  // Enable build caching for faster builds
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },
}

module.exports = withBundleAnalyzer(nextConfig)
