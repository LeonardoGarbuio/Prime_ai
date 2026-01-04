// SEO Metadata Helper - Prime AI
import { Metadata } from 'next';
import { SEO_CONFIG, PAGE_METADATA } from './config';

export type PageKey = keyof typeof PAGE_METADATA;

interface GenerateMetadataParams {
    page: PageKey;
    title?: string;
    description?: string;
    image?: string;
    noIndex?: boolean;
}

export function generatePageMetadata({
    page,
    title,
    description,
    image,
    noIndex = false
}: GenerateMetadataParams): Metadata {
    const pageConfig = PAGE_METADATA[page];
    const finalTitle = title || pageConfig.title;
    const finalDescription = description || pageConfig.description;
    const finalImage = image || '/og-image.png';
    const canonical = `${SEO_CONFIG.siteUrl}${pageConfig.canonical}`;

    const metadata: Metadata = {
        title: finalTitle,
        description: finalDescription,
        keywords: [...SEO_CONFIG.keywords, ...pageConfig.keywords],
        authors: [{ name: SEO_CONFIG.creator }],
        creator: SEO_CONFIG.creator,
        publisher: SEO_CONFIG.publisher,
        robots: (noIndex || ('robots' in pageConfig && pageConfig.robots))
            ? (('robots' in pageConfig && pageConfig.robots) || 'noindex, follow')
            : { index: true, follow: true },
        alternates: {
            canonical
        },
        openGraph: {
            type: 'website',
            locale: SEO_CONFIG.locale,
            url: canonical,
            title: finalTitle,
            description: finalDescription,
            siteName: SEO_CONFIG.siteName,
            images: [
                {
                    url: finalImage,
                    width: 1200,
                    height: 630,
                    alt: finalTitle
                }
            ]
        },
        twitter: {
            card: 'summary_large_image',
            title: finalTitle,
            description: finalDescription,
            images: [finalImage],
            creator: SEO_CONFIG.social.twitter
        },
        verification: {
            google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
            // yandex: 'yandex-verification-code',
            // other: 'other-verification-code'
        }
    };

    return metadata;
}

// Helper to generate simple metadata for dynamic pages
export function generateDynamicMetadata(
    title: string,
    description: string,
    image?: string
): Metadata {
    return {
        title: `${title} | ${SEO_CONFIG.siteName}`,
        description,
        openGraph: {
            title,
            description,
            images: image ? [image] : ['/og-image.png']
        },
        twitter: {
            title,
            description,
            images: image ? [image] : ['/og-image.png']
        }
    };
}
