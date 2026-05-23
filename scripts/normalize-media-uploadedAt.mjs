#!/usr/bin/env node
// One-shot backfill: convert any media.uploadedAt / createdAt values stored as
// BSON Date objects into ISO 8601 strings, matching what the upload route
// writes now via nowIso(). Mixed types break sort({uploadedAt:-1}) because
// MongoDB sorts strings and Dates in separate buckets.

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
if (!uri || !dbName) { console.error('MONGODB_URI / DB_NAME missing'); process.exit(1); }

const c = new MongoClient(uri);
await c.connect();
const media = c.db(dbName).collection('media');

const toFix = await media.find({
    $or: [{ uploadedAt: { $type: 'date' } }, { createdAt: { $type: 'date' } }],
}).project({ _id: 1, uploadedAt: 1, createdAt: 1 }).toArray();

console.log(`Found ${toFix.length} media docs with Date-typed timestamps. Normalising...`);

let n = 0;
for (const doc of toFix) {
    const update = {};
    if (doc.uploadedAt instanceof Date) update.uploadedAt = doc.uploadedAt.toISOString();
    if (doc.createdAt instanceof Date) update.createdAt = doc.createdAt.toISOString();
    if (Object.keys(update).length === 0) continue;
    await media.updateOne({ _id: doc._id }, { $set: update });
    n++;
    if (n % 25 === 0) console.log(`  ...${n}/${toFix.length}`);
}
console.log(`Done. Normalised ${n} docs.`);

// Sanity check
const remaining = await media.countDocuments({
    $or: [{ uploadedAt: { $type: 'date' } }, { createdAt: { $type: 'date' } }],
});
console.log(`Date-typed timestamps remaining: ${remaining}`);

await c.close();
