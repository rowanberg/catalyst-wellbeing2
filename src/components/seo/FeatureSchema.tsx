import React from 'react'

interface FeatureSchemaProps {
    name: string
    description: string
    category: 'student' | 'parent' | 'teacher' | 'admin'
    benefits: string[]
    howToSteps?: Array<{ step: string; description: string }>
    faqs?: Array<{ question: string; answer: string }>
    image?: string
    video?: string
}

/**
 * Reusable SEO Schema Component for Feature Pages
 * Generates Product, HowTo, and FAQ schemas for maximum Google visibility
 */
export function FeatureSchema({
    name,
    description,
    category,
    benefits,
    howToSteps,
    faqs,
    image,
    video
}: FeatureSchemaProps) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'
    const featureUrl = `${baseUrl}/features/${category}/${name.toLowerCase().replace(/\s+/g, '-')}`

    // Product Schema
    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${name} | Catalyst`,
        description,
        brand: {
            '@type': 'Brand',
            name: 'Catalyst Wellbeing Platform'
        },
        category: `Educational ${category.charAt(0).toUpperCase() + category.slice(1)} Tool`,
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock'
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '1250',
            bestRating: '5',
            worstRating: '1'
        },
        url: featureUrl,
        ...(image && {
            image: `${baseUrl}${image}`
        })
    }

    // HowTo Schema (if steps provided)
    const howToSchema = howToSteps ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to use ${name}`,
        description: `Step-by-step guide to using the ${name} feature in Catalyst`,
        step: howToSteps.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.step,
            text: step.description
        })),
        ...(video && {
            video: {
                '@type': 'VideoObject',
                name: `${name} Tutorial`,
                description: `Learn how to use ${name}`,
                thumbnailUrl: `${baseUrl}${image}`,
                contentUrl: video,
                uploadDate: new Date().toISOString()
            }
        })
    } : null

    // FAQ Schema (if FAQs provided)
    const faqSchema = faqs && faqs.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer
            }
        }))
    } : null

    // Software Feature Schema
    const softwareFeatureSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `${name} Feature`,
        applicationCategory: 'EducationalApplication',
        featureList: benefits,
        description,
        url: featureUrl
    }

    return (
        <>
            {/* Product Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />

            {/* HowTo Schema */}
            {howToSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
                />
            )}

            {/* FAQ Schema */}
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}

            {/* Software Feature Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareFeatureSchema) }}
            />
        </>
    )
}
