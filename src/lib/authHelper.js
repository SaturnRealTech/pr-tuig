import jwt from 'jsonwebtoken';

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
