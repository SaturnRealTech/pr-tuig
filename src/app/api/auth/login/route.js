import { NextResponse } from 'next/server';
import { col } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
        }

        const users = await col('users');
        const user = await users.findOne({ email });
        if (!user) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        const userId = user._id ? String(user._id) : '';
        // No `expiresIn` → token has no exp claim, so it stays valid until the
        // user clicks logout (which clears the cookie). WordPress-style.
        const token = jwt.sign(
            { userId, email: user.email, role: user.role },
            JWT_SECRET,
        );

        const response = NextResponse.json(
            {
                success: true,
                message: 'Login successful',
                user: { id: userId, name: user.name, email: user.email, role: user.role },
                token,
            },
            { status: 200 }
        );

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            // 10 years. Practically "forever" — only cleared by /api/auth/logout.
            maxAge: 60 * 60 * 24 * 365 * 10,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
