'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Skip tracking the admin area + bot traffic.
function shouldTrack(pathname) {
    if (!pathname) return false;
    if (pathname.startsWith('/admin')) return false;
    if (pathname.startsWith('/api')) return false;
    return true;
}

function getSessionId() {
    if (typeof window === 'undefined') return null;
    const KEY = 's_sid';
    try {
        let sid = sessionStorage.getItem(KEY);
        if (!sid) {
            sid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
            sessionStorage.setItem(KEY, sid);
        }
        return sid;
    } catch {
        return null;
    }
}

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const search = useSearchParams();

    useEffect(() => {
        if (!shouldTrack(pathname)) return;
        const path = pathname + (search?.toString() ? `?${search.toString()}` : '');
        const payload = JSON.stringify({
            path,
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            sessionId: getSessionId(),
        });

        // Prefer sendBeacon so the request survives navigations.
        try {
            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }));
                return;
            }
        } catch { /* fall through */ }

        // Fallback for browsers without sendBeacon.
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        }).catch(() => { /* ignore */ });
    }, [pathname, search]);

    return null;
}
