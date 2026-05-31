import { NextResponse } from 'next/server';
import { col, insertRow, nowIso } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activityLog';

export async function POST(request) {
    try {
        const { name, email, password, role } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const users = await col('users');
        const existing = await users.findOne({ email }, { projection: { _id: 1 } });
        if (existing) {
            return NextResponse.json({ success: false, error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const finalRole = role === 'editor' ? 'editor' : 'admin';

        const insertedId = await insertRow('users', {
            name,
            email,
            password: hashedPassword,
            role: finalRole,
            createdAt: nowIso(),
        });

        await logActivity(request, {
            type: 'user',
            action: 'create',
            section: `Role: ${finalRole}`,
            refId: String(insertedId),
            refTitle: email,
        });

        return NextResponse.json(
            {
                success: true,
                message: 'User created successfully',
                user: { id: String(insertedId), _id: String(insertedId), name, email, role: finalRole },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
