import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

// GET - Fetch all careers
export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const activeOnly = searchParams.get('activeOnly') === 'true';
        const skip = (page - 1) * limit;

        let query = {};

        // Only show active jobs for public view
        if (activeOnly) {
            query.isActive = true;
        }

        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count
        const total = await db.collection('careers').countDocuments(query);

        // Get paginated careers
        const careers = await db
            .collection('careers')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return NextResponse.json({
            success: true,
            data: careers,
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

// POST - Create a new job position
export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const body = await request.json();
        const {
            title,
            department,
            location,
            type,
            experience,
            salary,
            description,
            requirements,
            benefits
        } = body;

        // Validate required fields
        if (!title || !location || !type || !description) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: title, location, type, description' },
                { status: 400 }
            );
        }

        const newCareer = {
            title,
            department: department || '',
            location,
            type, // Full-time, Part-time, Contract, Remote
            experience: experience || '',
            salary: salary || '',
            description,
            requirements: requirements || [],
            benefits: benefits || [],
            isActive: true,
            applicationsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('careers').insertOne(newCareer);

        return NextResponse.json(
            { success: true, data: { _id: result.insertedId, ...newCareer } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete multiple careers
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No career IDs provided' },
                { status: 400 }
            );
        }

        const objectIds = ids.map(id => new ObjectId(id));

        const result = await db.collection('careers').deleteMany({
            _id: { $in: objectIds }
        });

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} position(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
