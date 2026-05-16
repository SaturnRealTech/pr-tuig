import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

// POST - Submit contact form
export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const body = await request.json();
        const contact = {
            ...body,
            submittedAt: new Date(),
            status: 'new' // Can be: new, contacted, closed
        };

        const result = await db.collection('contacts').insertOne(contact);

        return NextResponse.json(
            { success: true, message: 'Contact form submitted successfully', data: { _id: result.insertedId } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// GET - Fetch all contacts (for admin) with pagination and search
export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        let query = {};

        // Status filter
        if (status) {
            query.status = status;
        }

        // Search filter - search in name, email, phone, message
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await db.collection('contacts').countDocuments(query);

        // Get paginated contacts
        const contacts = await db
            .collection('contacts')
            .find(query)
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return NextResponse.json({
            success: true,
            data: contacts,
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

// DELETE - Delete single or multiple contacts
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const body = await request.json();
        const { ids } = body; // Array of contact IDs to delete

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No contact IDs provided' },
                { status: 400 }
            );
        }

        // Convert string IDs to ObjectId
        const objectIds = ids.map(id => new ObjectId(id));

        const result = await db.collection('contacts').deleteMany({
            _id: { $in: objectIds }
        });

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} contact(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
