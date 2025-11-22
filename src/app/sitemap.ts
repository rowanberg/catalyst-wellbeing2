import { MetadataRoute } from 'next'

/**
 * Dynamic Sitemap Generator for Catalyst Wellbeing Platform
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 * 
 * Optimized for single comprehensive features page with all 61+ features
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'
    const lastModified = new Date()

    const sitemapEntries: MetadataRoute.Sitemap = [
        // Core pages
        {
            url: baseUrl,
            lastModified,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/features`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.95,
        },
        {
            url: `${baseUrl}/login`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/register`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified,
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified,
            changeFrequency: 'yearly',
            priority: 0.5,
        },
    ]

    return sitemapEntries
}
