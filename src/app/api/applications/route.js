import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

// GET - Fetch all job applications (for admin)
export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'SaturnRealcon');

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const status = searchParams.get('status');
        const jobId = searchParams.get('jobId');
        const skip = (page - 1) * limit;

        let query = {};

        // Status filter
        if (status) {
            query.status = status;
        }

        // Job filter
        if (jobId) {
            query.jobId = jobId;
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { jobTitle: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count
        const total = await db.collection('applications').countDocuments(query);

        // Get paginated applications
        const applications = await db
            .collection('applications')
            .find(query)
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return NextResponse.json({
            success: true,
            data: applications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Submit a new job application
export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'SaturnRealcon');

        const body = await request.json();
        const {
            jobId,
            jobTitle,
            name,
            email,
            phone,
            linkedIn,
            currentPosition,
            experience,
            portfolio,
            resumeUrl,
            resumeFileName,
            coverLetter
        } = body;

        // Validate required fields
        if (!name || !email || !phone || !resumeUrl || !coverLetter) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const application = {
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
            status: 'new', // new, reviewed, shortlisted, rejected, hired
            appliedAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('applications').insertOne(application);

        return NextResponse.json(
            { success: true, message: 'Application submitted successfully', data: { _id: result.insertedId } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete applications
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'SaturnRealcon');

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No application IDs provided' },
                { status: 400 }
            );
        }

        const objectIds = ids.map(id => new ObjectId(id));

        const result = await db.collection('applications').deleteMany({
            _id: { $in: objectIds }
        });

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} application(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
