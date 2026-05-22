import { NextResponse } from 'next/server';
import { col, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';

// GET - Fetch all testimonials
export async function GET() {
    try {
        const testimonials = await col('testimonials');
        const rows = await testimonials.find({}).sort({ createdAt: -1 }).toArray();
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - Create a new testimonial
export async function POST(request) {
    try {
        const body = await request.json();
        const now = nowIso();
        const doc = { ...body, createdAt: now, updatedAt: now };
        Object.keys(doc).forEach(k => { if (doc[k] === undefined) delete doc[k]; });
        const testimonials = await col('testimonials');
        const result = await testimonials.insertOne(doc);
        return NextResponse.json(
            { success: true, data: { _id: String(result.insertedId), ...doc } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT - Update a testimonial
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, error: 'Testimonial ID is required' }, { status: 400 });
        }
        const body = await request.json();
        const updateData = { ...body, updatedAt: nowIso() };
        delete updateData.id;
        delete updateData._id;
        Object.keys(updateData).forEach(k => { if (updateData[k] === undefined) delete updateData[k]; });
        const changes = await updateByAnyId('testimonials', id, updateData);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: { _id: id, ...updateData } });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete a testimonial
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, error: 'Testimonial ID is required' }, { status: 400 });
        }
        const changes = await deleteByAnyId('testimonials', id);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
