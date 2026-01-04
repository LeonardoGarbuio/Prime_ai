// SEO Utilities Index - Export all SEO-related utilities
export { SEO_CONFIG, PAGE_METADATA } from './config';
export { generatePageMetadata, generateDynamicMetadata } from './metadata';
export {
    generateOrganizationSchema,
    generateWebSiteSchema,
    generateProductSchema,
    generateSoftwareApplicationSchema,
    generateFAQSchema,
    generateBreadcrumbSchema,
    generateHowToSchema,
    generateAggregateRatingSchema,
    createJsonLdScript
} from './schema';
