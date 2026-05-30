import SitemapPage from '@/features/sitemap/SitemapPage';
import {
    createBreadcrumbSchema,
    createPageMetadata,
    createWebPageSchema,
} from '@/lib/seo';

const sitemapPath = '/sitemap';
const sitemapTitle = 'Sitemap';
const sitemapDescription = 'Quickly navigate all important pages on the site.';

const sitemapPageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
        createWebPageSchema({
            path: sitemapPath,
            name: 'Sitemap',
            description: 'Browse key pages and sections of the website.',
            type: 'CollectionPage',
        }),
        createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Sitemap', path: sitemapPath },
        ]),
    ],
};

export async function generateMetadata() {
    return createPageMetadata({
        title: sitemapTitle,
        description: sitemapDescription,
        path: sitemapPath,
    });
}

export default function Page() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sitemapPageSchema) }} />
            <SitemapPage />
        </>
    );
}
