import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { name, email, password, role } = await request.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'User already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: role === 'editor' ? 'editor' : 'admin',
            createdAt: new Date(),
        };

        const result = await db.collection('users').insertOne(newUser);

        return NextResponse.json(
            {
                success: true,
                message: 'User created successfully',
                user: {
                    id: result.insertedId,
                    name,
                    email,
                    role: newUser.role,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
