import jwt from 'jsonwebtoken';
import { col } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export function getUserFromRequest(request) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(/auth-token=([^;]+)/);
        if (!match) return null;
        const token = decodeURIComponent(match[1]);
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

export function requireAdmin(request) {
    const user = getUserFromRequest(request);
    if (!user) return { error: 'Unauthorized', status: 401 };
    if (user.role !== 'admin') return { error: 'Editors cannot delete content', status: 403 };
    return null;
}

// Strict admin-only gate. Used by surfaces that must NEVER be opened by a
// non-admin even if Role Manager has granted them the permission — e.g. the
// leads vault. Bypasses the role-permission map entirely.
export function requireAdminOnly(request) {
    const user = getUserFromRequest(request);
    if (!user) return { error: 'Unauthorized', status: 401 };
    if (user.role !== 'admin') return { error: 'Only admin can access this resource.', status: 403 };
    return null;
}

// ---------------------------------------------------------------------------
//  Role Manager — granular per-module permissions
// ---------------------------------------------------------------------------
//
// Each role has an entry per MODULE listing which ACTIONS it can perform.
// Stored as JSON inside settings.permissions (so it can be edited live).
//
//   { admin: { projects: ['view','create','edit','delete'], ... }, ... }
//
// Permission check helper:
//
//   import { can, requirePermission } from '@/lib/authHelper';
//   const guard = requirePermission(request, 'projects', 'delete');
//   if (guard) return NextResponse.json({...guard}, { status: guard.status });
//

export const ROLES = ['admin', 'editor', 'viewer'];

export const MODULES = [
    'projects',
    'blog',
    'blogCategories',
    'categories',
    'builders',
    'leads',
    'contacts',
    'applications',
    'careers',
    'testimonials',
    'media',
    'users',
    'settings',
    'redirects',
    'analytics',
    'pages',
];

export const ACTIONS = ['view', 'create', 'edit', 'delete'];

// Sensible defaults. Admins do everything; editors create + edit content but
// don't manage users/settings/redirects; viewers can only read.
export const DEFAULT_PERMISSIONS = (() => {
    const full = (m) => ({ [m]: ['view', 'create', 'edit', 'delete'] });
    const viewOnly = (m) => ({ [m]: ['view'] });
    const adminMap = MODULES.reduce((acc, m) => Object.assign(acc, full(m)), {});
    const viewerMap = MODULES.reduce((acc, m) => Object.assign(acc, viewOnly(m)), {});
    const editorMap = MODULES.reduce((acc, m) => {
        if (['users', 'settings', 'redirects', 'analytics'].includes(m)) Object.assign(acc, viewOnly(m));
        else if (['leads', 'contacts', 'applications'].includes(m)) Object.assign(acc, { [m]: ['view', 'edit'] });
        else Object.assign(acc, { [m]: ['view', 'create', 'edit'] });
        return acc;
    }, {});
    return { admin: adminMap, editor: editorMap, viewer: viewerMap };
})();

async function readPermissions() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        if (!row) return DEFAULT_PERMISSIONS;
        const saved = row.data?.permissions;
        if (saved && typeof saved === 'object') return saved;
        return DEFAULT_PERMISSIONS;
    } catch {
        return DEFAULT_PERMISSIONS;
    }
}

export async function getPermissions() {
    const saved = await readPermissions();
    const out = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
    for (const role of ROLES) {
        if (saved[role] && typeof saved[role] === 'object') {
            out[role] = { ...out[role], ...saved[role] };
        }
    }
    return out;
}

export async function can(user, moduleName, action) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const role = ROLES.includes(user.role) ? user.role : 'viewer';
    const perms = await getPermissions();
    const allowed = (perms[role] && perms[role][moduleName]) || [];
    return Array.isArray(allowed) && allowed.includes(action);
}

// Convenience: returns { error, status } when blocked, null when allowed.
export async function requirePermission(request, moduleName, action) {
    const user = getUserFromRequest(request);
    if (!user) return { error: 'Unauthorized', status: 401 };
    if (!(await can(user, moduleName, action))) {
        return { error: `Your role (${user.role}) does not have ${action} access to ${moduleName}.`, status: 403 };
    }
    return null;
}
