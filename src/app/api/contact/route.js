import { NextResponse } from 'next/server';
import { col, nowIso, toObjectId } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// POST - Submit contact form
export async function POST(request) {
    try {
        const body = await request.json();
        const now = nowIso();
        const doc = { ...body, status: 'new', submittedAt: now, createdAt: now };
        Object.keys(doc).forEach(k => { if (doc[k] === undefined) delete doc[k]; });
        const contacts = await col('contacts');
        const result = await contacts.insertOne(doc);
        return NextResponse.json(
            { success: true, message: 'Contact form submitted successfully', data: { _id: String(result.insertedId) } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// GET - Fetch all contacts (for admin) with pagination and search
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search') || '';
        const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 10, 1), 200);
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (search) {
            const re = new RegExp(reEscape(search), 'i');
            filter.$or = [{ name: re }, { email: re }, { mobileNumber: re }, { phone: re }, { message: re }];
        }

        const contacts = await col('contacts');
        const [total, rows] = await Promise.all([
            contacts.countDocuments(filter),
            contacts.find(filter).sort({ submittedAt: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
        ]);

        return NextResponse.json({
            success: true,
            data: rows,
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete single or multiple contacts
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { ids } = await request.json();
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, error: 'No contact IDs provided' }, { status: 400 });
        }
        const objectIds = ids.map(toObjectId).filter(Boolean);
        const stringIds = ids.map(String);
        const contacts = await col('contacts');
        const result = await contacts.deleteMany({ $or: [{ _id: { $in: objectIds } }, { _id: { $in: stringIds } }] });
        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} contact(s) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
