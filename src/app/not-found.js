// Global 404 page. Renders the standard "not found" message and fires a
// background beacon to /api/404-log so the admin's 404 Monitor can show what
// URLs visitors are landing on that don't exist.

import NotFoundClient from '@/components/NotFoundClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Page not found',
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return <NotFoundClient />;
}
