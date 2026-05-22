import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import { revokeToken } from '@/lib/google/oauth';
import { invalidateTokenCache } from '@/lib/google/auth';

export async function POST(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        await revokeToken();
        invalidateTokenCache();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
