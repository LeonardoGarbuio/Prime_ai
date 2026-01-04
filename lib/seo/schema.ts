// Schema.org JSON-LD generators for Prime AI
import { SEO_CONFIG } from './config';

// Organization Schema
export function generateOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": SEO_CONFIG.siteName,
        "url": SEO_CONFIG.siteUrl,
        "logo": `${SEO_CONFIG.siteUrl}/logo.png`,
        "description": SEO_CONFIG.defaultDescription,
        "sameAs": [
            `https://twitter.com/${SEO_CONFIG.social.twitter}`,
            `https://facebook.com/${SEO_CONFIG.social.facebook}`,
            `https://instagram.com/${SEO_CONFIG.social.instagram}`
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Support",
            "availableLanguage": ["Portuguese"]
        }
    };
}

// WebSite Schema with Search Action
export function generateWebSiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": SEO_CONFIG.siteName,
        "url": SEO_CONFIG.siteUrl,
        "description": SEO_CONFIG.defaultDescription,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${SEO_CONFIG.siteUrl}/scan?ref=search`
            },
            "query-input": "required name=search_term_string"
        }
    };
}

// Product/Service Schema (for VIP Scanner)
export function generateProductSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Prime AI VIP Scanner",
        "description": "Scanner facial premium com análises ilimitadas e insights profundos usando inteligência artificial avançada.",
        "brand": {
            "@type": "Brand",
            "name": SEO_CONFIG.siteName
        },
        "offers": {
            "@type": "Offer",
            "url": `${SEO_CONFIG.siteUrl}/vip-scanner`,
            "priceCurrency": "BRL",
            "price": "97.00",
            "priceValidUntil": "2026-12-31",
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": SEO_CONFIG.siteName
            }
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "1247"
        }
    };
}

// SoftwareApplication Schema
export function generateSoftwareApplicationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": SEO_CONFIG.siteName,
        "operatingSystem": "Web",
        "applicationCategory": "HealthApplication",
        "description": SEO_CONFIG.defaultDescription,
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "BRL"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1247"
        }
    };
}

// FAQPage Schema
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

// Breadcrumb Schema
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": `${SEO_CONFIG.siteUrl}${item.url}`
        }))
    };
}

// Helper function to inject JSON-LD script
export function createJsonLdScript(schema: object | object[]) {
    return {
        __html: JSON.stringify(Array.isArray(schema) ? schema : schema)
    };
}
