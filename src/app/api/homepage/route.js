import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET - Fetch homepage content
export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';

        // Fetch homepage data
        const homepage = await db.collection('homepage').findOne({});

        // Fetch projects with pagination and search
        let projectsQuery = {};
        if (search) {
            projectsQuery = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { projectAddress: { $regex: search, $options: 'i' } },
                    { company: { $regex: search, $options: 'i' } },
                    { categories: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const projects = await db.collection('projects')
            .find(projectsQuery)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        const total = await db.collection('projects').countDocuments(projectsQuery);

        return NextResponse.json({
            success: true,
            data: {
                ...homepage,
                projects,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching homepage data:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Update homepage content
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            heroTitle,
            heroSubtitle,
            heroDescription,
            heroCtaText,
            heroCtaLink,
            desktopHeroBanner,
            mobileHeroBanner,
            featuredProjectsTitle,
            featuredProjectsSubtitle,
            aboutSectionTitle,
            aboutSectionContent,
            whyChooseUsTitle,
            whyChooseUsContent,
            testimonialsTitle,
            metaTitle,
            metaDescription,
            keywords,
            featuredProjects,
        } = body;

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const homepageData = {
            heroTitle: heroTitle || '',
            heroSubtitle: heroSubtitle || '',
            heroDescription: heroDescription || '',
            heroCtaText: heroCtaText || '',
            heroCtaLink: heroCtaLink || '',
            desktopHeroBanner: desktopHeroBanner || '',
            mobileHeroBanner: mobileHeroBanner || '',
            featuredProjectsTitle: featuredProjectsTitle || '',
            featuredProjectsSubtitle: featuredProjectsSubtitle || '',
            aboutSectionTitle: aboutSectionTitle || '',
            aboutSectionContent: aboutSectionContent || '',
            whyChooseUsTitle: whyChooseUsTitle || '',
            whyChooseUsContent: whyChooseUsContent || '',
            testimonialsTitle: testimonialsTitle || '',
            metaTitle: metaTitle || '',
            metaDescription: metaDescription || '',
            keywords: keywords || '',
            featuredProjects: Array.isArray(featuredProjects) ? featuredProjects : [],
            updatedAt: new Date(),
        };

        // Update or insert homepage data
        await db.collection('homepage').updateOne(
            {},
            {
                $set: homepageData,
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            data: homepageData,
            message: 'Homepage updated successfully',
        });
    } catch (error) {
        console.error('Error updating homepage:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
