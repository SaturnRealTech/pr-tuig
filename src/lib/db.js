// Shared MongoDB client. Replaces the old SQLite (better-sqlite3) layer.
//
// Usage from any API route / page:
//     import { col, findOneByAnyId } from '@/lib/db';
//     const projects = await col('projects');
//     const project = await projects.findOne({ slug });
//
// Helper signatures mirror the old sqlite.js where possible so most call sites
// only need: (a) swap the import and (b) await the call (everything is async now).

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'Saturnrealcon';

if (!MONGODB_URI) {
    console.warn('[db] MONGODB_URI is not set — Mongo operations will fail.');
}

// Re-use the connection across hot reloads in dev.
const cacheKey = '__saturn_mongo_client__';
function clientPromise() {
    if (!globalThis[cacheKey]) {
        globalThis[cacheKey] = new MongoClient(MONGODB_URI, {
            maxPoolSize: 20,
        }).connect();
    }
    return globalThis[cacheKey];
}

export async function getDb() {
    const client = await clientPromise();
    return client.db(DB_NAME);
}

// Convenience wrapper. Pass the collection name and get the collection back.
export async function col(name) {
    const db = await getDb();
    return db.collection(name);
}

// ---------- ID helpers ----------

function toObjectId(v) {
    if (v == null) return null;
    if (v instanceof ObjectId) return v;
    if (typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v)) {
        try { return new ObjectId(v); } catch { return null; }
    }
    return null;
}

// Build an {_id} filter that accepts both ObjectId-encoded ids and bare strings.
function idFilter(v) {
    const oid = toObjectId(v);
    if (oid) return { $or: [{ _id: oid }, { _id: String(v) }] };
    return { _id: String(v) };
}

export { ObjectId, toObjectId, idFilter };

// ---------- High-level helpers (drop-in replacements for the SQLite versions) ----------

// Find a row by _id (ObjectId or string) OR by slug. Mirrors the old sqlite
// helper. Always async now.
export async function findOneByAnyId(collection, idOrSlug, { withSlug = true } = {}) {
    if (idOrSlug == null) return null;
    const v = String(idOrSlug);
    const c = await col(collection);
    const byId = await c.findOne(idFilter(v));
    if (byId) return byId;
    if (withSlug) {
        const bySlug = await c.findOne({ slug: v });
        if (bySlug) return bySlug;
    }
    return null;
}

export async function insertRow(collection, data) {
    const c = await col(collection);
    const payload = stripUndefined(data);
    const result = await c.insertOne(payload);
    return result.insertedId;
}

export async function updateRow(collection, idField, idValue, data) {
    const cleaned = stripUndefined(data);
    if (Object.keys(cleaned).length === 0) return 0;
    const c = await col(collection);
    const filter = idField === '_id' ? idFilter(idValue) : { [idField]: idValue };
    const result = await c.updateOne(filter, { $set: cleaned });
    return result.modifiedCount;
}

export async function updateByAnyId(collection, idOrSlug, data) {
    const row = await findOneByAnyId(collection, idOrSlug);
    if (!row) return 0;
    const cleaned = stripUndefined(data);
    if (Object.keys(cleaned).length === 0) return 0;
    const c = await col(collection);
    const result = await c.updateOne({ _id: row._id }, { $set: cleaned });
    return result.modifiedCount;
}

export async function deleteByAnyId(collection, idOrSlug) {
    const row = await findOneByAnyId(collection, idOrSlug);
    if (!row) return 0;
    const c = await col(collection);
    const result = await c.deleteOne({ _id: row._id });
    return result.deletedCount;
}

export async function upsertByKey(collection, keyField, keyValue, data) {
    const c = await col(collection);
    const cleaned = stripUndefined(data);
    const result = await c.updateOne(
        { [keyField]: keyValue },
        { $set: { [keyField]: keyValue, ...cleaned } },
        { upsert: true },
    );
    if (result.upsertedId) return result.upsertedId;
    const found = await c.findOne({ [keyField]: keyValue }, { projection: { _id: 1 } });
    return found?._id ?? null;
}

function stripUndefined(data) {
    const out = {};
    for (const [k, v] of Object.entries(data || {})) {
        if (v !== undefined) out[k] = v;
    }
    return out;
}

// ---------- JSON helpers (no-op with Mongo) ----------
// Mongo stores objects natively, so these helpers don't need to parse/stringify.
// Kept as identity functions so the existing call sites compile unchanged.

export function inflate(row /* , jsonCols */) { return row || null; }

export function jsonGet(row, ...keys) {
    if (!row) return null;
    for (const k of keys) {
        const v = row[k];
        if (v != null) return v;
    }
    return null;
}

export function jsonSet(v) { return v; }

// Mongo doesn't need boolean→int or object→json string normalisation. Just
// drop undefined fields so they don't end up as nulls.
export function prepareForInsert(data /* , jsonCols */) {
    return stripUndefined(data);
}

// Stub column-name arrays kept for backward compat with old `inflate(row, BLOG_JSON_COLS)`
// call sites. They're no longer meaningful but importing them stays valid.
export const PROJECT_JSON_COLS = [
    'amenities', 'highlightItems', 'configurationRows', 'masterFloorPlan',
    'gallery', 'projectSpecifications', 'location', 'faqs', 'detailedOverview',
];
export const BLOG_JSON_COLS = ['seo'];
export const CATEGORY_JSON_COLS = ['faqs'];
export const CAREER_JSON_COLS = ['requirements', 'benefits'];

// ---------- Misc ----------

export function nowIso() { return new Date().toISOString(); }

// Generate a fresh ObjectId as a string. New documents that need a stable
// public id (e.g. `_id` for upserts) use this; otherwise let Mongo auto-fill.
export function genId() { return new ObjectId().toString(); }

// Convenience: fetch a project by slug.
export async function getProjectBySlug(slug) {
    const c = await col('projects');
    return c.findOne({ slug });
}

// Convenience: the published "home page" project.
export async function getHomepageProject() {
    const c = await col('projects');
    return (
        (await c.findOne({ publishStatus: 'published', isHomePage: true })) ||
        (await c.findOne({ publishStatus: 'published' }, { sort: { createdAt: 1 } }))
    );
}

// Default export — a tiny wrapper that exposes `db.collection(name)` as a
// shorthand for the named `col()` helper. Mainly there to support a few
// legacy `import db from '@/lib/db'` callers.
const db = {
    collection: async (name) => col(name),
};

export default db;
