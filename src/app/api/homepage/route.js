import { NextResponse } from 'next/server';
import { col, nowIso } from '@/lib/db';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// GET - Fetch homepage content
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 10, 1), 200);
        const search = searchParams.get('search') || '';

        const [homepageCol, projectsCol] = await Promise.all([col('homepage'), col('projects')]);
        const homepageRow = await homepageCol.findOne({});
        const homepageData = homepageRow ? {
            ...(homepageRow.data || {}),
            localBusinessSchema: homepageRow.localBusinessSchema || '',
            organizationSchema: homepageRow.organizationSchema || '',
        } : {};

        const filter = {};
        if (search) {
            const re = new RegExp(reEscape(search), 'i');
            filter.$or = [{ title: re }, { projectAddress: re }, { company: re }, { categories: re }];
        }

        const [total, projects] = await Promise.all([
            projectsCol.countDocuments(filter),
            projectsCol
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray(),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                ...homepageData,
                projects,
                total,
                page,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching homepage data:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - Update homepage content
export async function POST(request) {
    try {
        const body = await request.json();
        const homepageBlob = {
            heroTitle: body.heroTitle || '',
            heroSubtitle: body.heroSubtitle || '',
            heroDescription: body.heroDescription || '',
            heroCtaText: body.heroCtaText || '',
            heroCtaLink: body.heroCtaLink || '',
            desktopHeroBanner: body.desktopHeroBanner || '',
            mobileHeroBanner: body.mobileHeroBanner || '',
            featuredProjectsTitle: body.featuredProjectsTitle || '',
            featuredProjectsSubtitle: body.featuredProjectsSubtitle || '',
            aboutSectionTitle: body.aboutSectionTitle || '',
            aboutSectionContent: body.aboutSectionContent || '',
            whyChooseUsTitle: body.whyChooseUsTitle || '',
            whyChooseUsContent: body.whyChooseUsContent || '',
            testimonialsTitle: body.testimonialsTitle || '',
            metaTitle: body.metaTitle || '',
            metaDescription: body.metaDescription || '',
            keywords: body.keywords || '',
            featuredProjects: Array.isArray(body.featuredProjects) ? body.featuredProjects : [],
        };

        const now = nowIso();
        const homepage = await col('homepage');
        const existing = await homepage.findOne({});
        const payload = {
            data: homepageBlob,
            localBusinessSchema: body.localBusinessSchema || '',
            organizationSchema: body.organizationSchema || '',
            updatedAt: now,
        };

        if (existing) {
            await homepage.updateOne({ _id: existing._id }, { $set: payload });
        } else {
            payload.createdAt = now;
            await homepage.insertOne(payload);
        }

        return NextResponse.json({
            success: true,
            data: { ...homepageBlob, localBusinessSchema: payload.localBusinessSchema, organizationSchema: payload.organizationSchema },
            message: 'Homepage updated successfully',
        });
    } catch (error) {
        console.error('Error updating homepage:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
