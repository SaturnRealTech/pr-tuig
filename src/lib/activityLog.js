import { col } from '@/lib/db';
import { getUserFromRequest } from '@/lib/authHelper';

// activity_log collection schema:
//   { type, action, section?, refId?, refTitle?, userId, userEmail, userRole, ip, at }
// type:    'project' | 'blog' | 'settings' | 'user' | 'auth'
// action:  'create' | 'edit' | 'delete' | 'login' | 'logout' | 'permissions'
//
// We never throw — logging is best-effort. A logging failure must not break the
// actual operation the admin was performing.

function ipFrom(request) {
    if (!request) return '';
    const h = request.headers;
    return (
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        h.get('x-real-ip') ||
        ''
    );
}

export async function logActivity(request, entry) {
    try {
        const user = request ? getUserFromRequest(request) : null;
        const doc = {
            type: entry.type || 'unknown',
            action: entry.action || 'edit',
            section: entry.section || '',
            refId: entry.refId ? String(entry.refId) : '',
            refTitle: entry.refTitle || '',
            note: entry.note || '',
            userId: entry.userId || user?.userId || '',
            userEmail: entry.userEmail || user?.email || '',
            userRole: entry.userRole || user?.role || '',
            ip: entry.ip || ipFrom(request),
            at: new Date().toISOString(),
        };
        const c = await col('activity_log');
        await c.insertOne(doc);
    } catch (e) {
        console.error('[activityLog]', e.message);
    }
}
