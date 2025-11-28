/** @type {import('next').NextConfig} */
const path = require('path')

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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 604800, // 7 days cache
    deviceSizes: [40, 44, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 40, 44, 48, 64, 96],
  },

  // Set the correct workspace root to silence lockfile warning
  outputFileTracingRoot: __dirname,

  // Custom headers for performance and caching
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
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
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

      // Enable webpack caching for faster rebuilds in dev
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.join(__dirname, '.next/cache/webpack'),
        buildDependencies: {
          config: [__filename],
        },
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

  // Optimize build for production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Note: SWC minification is now default in Next.js 13+ (no config needed)
  },

  // Enable compression
  compress: true,

  // Generate source maps for better debugging
  productionBrowserSourceMaps: false,

  // Skip static generation for dynamic admin pages
  async redirects() {
    return [
      {
        source: '/student/sleep',
        destination: '/student/habits',
        permanent: true,
      },
      {
        source: '/student/water',
        destination: '/student/habits',
        permanent: true,
      },
      {
        source: '/student/courage',
        destination: '/student/courage-log',
        permanent: true,
      },
    ]
  },

  // Enable build caching for faster builds
  experimental: {
    // Optimize CSS
    optimizeCss: true,

    // Enable modern optimizations for faster compilation
    optimizePackageImports: [
      // 'lucide-react', // Disabled due to webpack barrel optimization conflicts
      'framer-motion',
      'recharts',
      '@supabase/supabase-js',
      'date-fns'
    ],

    // Enable webpack build cache for much faster rebuilds
    webpackBuildWorker: true,

    // Enable parallel compilation
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },

  // Performance optimizations
  poweredByHeader: false,
  generateEtags: true,
}

module.exports = withBundleAnalyzer(nextConfig)
