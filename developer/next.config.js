/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: [
            'app.catalystwells.com',
            'developers.catalystwells.com',
            'supabase.co',
            'avatars.githubusercontent.com',
            'lh3.googleusercontent.com'
        ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: '**.catalystwells.com',
            }
        ]
    },
    env: {
        NEXT_PUBLIC_APP_NAME: 'CatalystWells Developer Portal',
        NEXT_PUBLIC_APP_VERSION: '1.0.0',
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    // Optimize for production
    compress: true,
    poweredByHeader: false,

    // Security headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    }
                ]
            }
        ]
    },

    // Redirects
    async redirects() {
        return [
            {
                source: '/docs',
                destination: '/documentation',
                permanent: false,
            },
        ]
    },
}

module.exports = nextConfig
