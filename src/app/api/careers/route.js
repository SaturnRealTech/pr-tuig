import { NextResponse } from 'next/server';
import { col, nowIso, toObjectId } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// GET - Fetch all careers
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 10, 1), 200);
        const activeOnly = searchParams.get('activeOnly') === 'true';
        const skip = (page - 1) * limit;

        const filter = {};
        if (activeOnly) filter.isActive = true;
        if (search) {
            const re = new RegExp(reEscape(search), 'i');
            filter.$or = [{ title: re }, { location: re }, { department: re }, { type: re }];
        }

        const careers = await col('careers');
        const [total, rows] = await Promise.all([
            careers.countDocuments(filter),
            careers.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
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

// POST - Create a new job position
export async function POST(request) {
    try {
        const body = await request.json();
        const { title, department, location, type, experience, salary, description, requirements, benefits } = body;

        if (!title || !location || !type || !description) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: title, location, type, description' },
                { status: 400 }
            );
        }

        const now = nowIso();
        const doc = {
            title,
            department: department || '',
            location,
            type,
            experience: experience || '',
            salary: salary || '',
            description,
            requirements: Array.isArray(requirements) ? requirements : [],
            benefits: Array.isArray(benefits) ? benefits : [],
            isActive: true,
            applicationsCount: 0,
            createdAt: now,
            updatedAt: now,
        };
        const careers = await col('careers');
        const result = await careers.insertOne(doc);
        return NextResponse.json(
            { success: true, data: { _id: String(result.insertedId), ...doc } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete multiple careers
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { ids } = await request.json();
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, error: 'No career IDs provided' }, { status: 400 });
        }
        const objectIds = ids.map(toObjectId).filter(Boolean);
        const stringIds = ids.map(String);
        const careers = await col('careers');
        const result = await careers.deleteMany({ $or: [{ _id: { $in: objectIds } }, { _id: { $in: stringIds } }] });
        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} position(s) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
