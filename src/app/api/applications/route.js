import { NextResponse } from 'next/server';
import { col, nowIso, toObjectId } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';
import { deleteFromS3 } from '@/lib/s3-upload';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// GET - Fetch all job applications (for admin)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 10, 1), 200);
        const status = searchParams.get('status');
        const jobId = searchParams.get('jobId');
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (jobId) filter.jobId = jobId;
        if (search) {
            const re = new RegExp(reEscape(search), 'i');
            filter.$or = [{ name: re }, { email: re }, { phone: re }, { jobTitle: re }];
        }

        const apps = await col('applications');
        const [total, rows] = await Promise.all([
            apps.countDocuments(filter),
            apps.find(filter).sort({ appliedAt: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
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

// POST - Submit a new job application
export async function POST(request) {
    try {
        const body = await request.json();
        const { jobId, jobTitle, name, email, phone, linkedIn, currentPosition,
            experience, portfolio, resumeUrl, resumeFileName, coverLetter } = body;

        if (!name || !email || !phone || !resumeUrl || !coverLetter) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const now = nowIso();
        const doc = {
            jobId: jobId || 'general',
            jobTitle: jobTitle || 'General Application',
            name,
            email,
            phone,
            linkedIn: linkedIn || '',
            currentPosition: currentPosition || '',
            experience: experience || '',
            portfolio: portfolio || '',
            resumeUrl,
            resumeFileName: resumeFileName || 'resume.pdf',
            coverLetter,
            status: 'new',
            appliedAt: now,
            updatedAt: now,
            createdAt: now,
        };
        const apps = await col('applications');
        const result = await apps.insertOne(doc);
        return NextResponse.json(
            { success: true, message: 'Application submitted successfully', data: { _id: String(result.insertedId) } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete applications
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { ids } = await request.json();
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, error: 'No application IDs provided' }, { status: 400 });
        }
        const objectIds = ids.map(toObjectId).filter(Boolean);
        const stringIds = ids.map(String);
        const apps = await col('applications');
        const filter = { $or: [{ _id: { $in: objectIds } }, { _id: { $in: stringIds } }] };

        // Grab the resume URLs first so we can purge them from S3 after the
        // DB delete succeeds. If a row has no resumeUrl we just skip.
        const rows = await apps.find(filter).project({ resumeUrl: 1 }).toArray();
        const resumeUrls = rows.map(r => r.resumeUrl).filter(Boolean);

        const result = await apps.deleteMany(filter);

        await Promise.all(resumeUrls.map(u =>
            deleteFromS3(u).catch(e => console.error('[application] S3 delete failed:', u, e.message))
        ));

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} application(s) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
