/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable in Next.js 13+, no experimental flag needed
  
  // Suppress hydration warnings caused by browser extensions
  reactStrictMode: true,
  
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
    return config
  },
}

module.exports = nextConfig
