'use client';

// Client half of the 404 page. Fires a fire-and-forget beacon at /api/404-log
// so the admin's 404 Monitor surfaces broken inbound links and can convert
// them into redirects with one click.

import { useEffect } from 'react';
import Link from 'next/link';

export default function NotFoundClient() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const path = window.location.pathname + (window.location.search || '');
        const referrer = document.referrer || '';
        // Don't pollute the log with admin / dev / known-bot bounces.
        if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/_next')) return;

        const payload = JSON.stringify({ path, referrer });
        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/404-log', new Blob([payload], { type: 'application/json' }));
            } else {
                fetch('/api/404-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true,
                }).catch(() => { });
            }
        } catch { /* analytics never breaks the page */ }
    }, []);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-gold font-bold mb-3">404</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">Page not found</h1>
            <p className="text-foreground/70 max-w-md mb-8">
                The page you&apos;re looking for doesn&apos;t exist or has been moved. Try the homepage or our blog.
            </p>
            <div className="flex gap-3">
                <Link href="/" className="px-5 py-2.5 bg-gold text-white rounded-lg font-semibold hover:opacity-90 transition">
                    Go home
                </Link>
                <Link href="/blog" className="px-5 py-2.5 border border-gold/40 text-gold rounded-lg font-semibold hover:bg-gold/10 transition">
                    Read the blog
                </Link>
            </div>
        </main>
    );
}
