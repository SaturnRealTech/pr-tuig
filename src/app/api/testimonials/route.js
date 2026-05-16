import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/lib/authHelper';

// GET - Fetch all testimonials
export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const testimonials = await db
            .collection('testimonials')
            .find({})
            .toArray();

        return NextResponse.json({ success: true, data: testimonials });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create a new testimonial
export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const body = await request.json();
        const newTestimonial = {
            ...body,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('testimonials').insertOne(newTestimonial);

        return NextResponse.json(
            { success: true, data: { _id: result.insertedId, ...newTestimonial } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update a testimonial
export async function PUT(request) {
    try {
        const { ObjectId } = await import('mongodb');
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Testimonial ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const updateData = {
            ...body,
            updatedAt: new Date()
        };

        const result = await db.collection('testimonials').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Testimonial not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: { _id: id, ...updateData } });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete a testimonial
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { ObjectId } = await import('mongodb');
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Testimonial ID is required' },
                { status: 400 }
            );
        }

        const result = await db.collection('testimonials').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Testimonial not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
