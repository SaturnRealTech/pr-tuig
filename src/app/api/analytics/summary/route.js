// GET /api/analytics/summary?range=7d|30d|90d&limit=20
// Returns aggregates for the dashboard: counts, top pages, top referrers,
// devices, browsers, daily series, and the latest visits.

import { NextResponse } from 'next/server';
import { col } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';

const RANGES = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, '365d': 365 };

export async function GET(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30d';
        const days = RANGES[range] || 30;
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

        const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
        const visits = await col('analytics_visits');
        const match = { ts: { $gte: since } };

        const [totalsAgg, topPages, topReferrers, devices, browsers, daily, recent] = await Promise.all([
            visits.aggregate([
                { $match: match },
                { $group: {
                    _id: null,
                    pageViews: { $sum: 1 },
                    sessionSet: { $addToSet: '$sessionId' },
                    ipSet: { $addToSet: '$ipHash' },
                } },
                { $project: {
                    _id: 0,
                    pageViews: 1,
                    sessions: { $size: '$sessionSet' },
                    uniqueIps: { $size: '$ipSet' },
                } },
            ]).toArray(),

            visits.aggregate([
                { $match: match },
                { $group: { _id: '$path', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: limit },
                { $project: { _id: 0, path: '$_id', count: 1 } },
            ]).toArray(),

            visits.aggregate([
                { $match: match },
                { $group: {
                    _id: { $cond: [{ $or: [{ $eq: ['$referrer', null] }, { $eq: ['$referrer', ''] }] }, '(direct)', '$referrer'] },
                    count: { $sum: 1 },
                } },
                { $sort: { count: -1 } },
                { $limit: limit },
                { $project: { _id: 0, referrer: '$_id', count: 1 } },
            ]).toArray(),

            visits.aggregate([
                { $match: match },
                { $group: { _id: { $ifNull: ['$device', 'desktop'] }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $project: { _id: 0, device: '$_id', count: 1 } },
            ]).toArray(),

            visits.aggregate([
                { $match: match },
                { $group: {
                    _id: { $cond: [{ $or: [{ $eq: ['$browser', null] }, { $eq: ['$browser', ''] }] }, '(unknown)', '$browser'] },
                    count: { $sum: 1 },
                } },
                { $sort: { count: -1 } },
                { $limit: limit },
                { $project: { _id: 0, browser: '$_id', count: 1 } },
            ]).toArray(),

            visits.aggregate([
                { $match: match },
                { $group: { _id: { $substr: ['$ts', 0, 10] }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
                { $project: { _id: 0, day: '$_id', count: 1 } },
            ]).toArray(),

            visits
                .find({}, { projection: { path: 1, referrer: 1, device: 1, browser: 1, os: 1, country: 1, ts: 1 } })
                .sort({ ts: -1 })
                .limit(limit)
                .toArray(),
        ]);

        const totals = totalsAgg[0] || { pageViews: 0, sessions: 0, uniqueIps: 0 };

        return NextResponse.json({
            success: true,
            range,
            since,
            data: { totals, topPages, topReferrers, devices, browsers, daily, recent },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
