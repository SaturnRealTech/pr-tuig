import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json(
        { success: true, message: 'Logged out successfully' },
        { status: 200 }
    );

    // Clear auth cookie
    response.cookies.delete('auth-token');

    return response;
}
