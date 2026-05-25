// Remove `nofollow` from rel attributes in stored HTML content.
// Touches only the `rel="..."` attribute value — leaves the rest of the
// document (text, other attributes, tags) untouched.
//
// Run: node scripts/strip-nofollow.js [--dry]

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const dryRun = process.argv.includes('--dry');
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'Saturnrealcon';

if (!uri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
}

// Match `<space>rel="value"`. Capture the value so we can rebuild it.
const REL_RE = /\srel\s*=\s*"([^"]*)"/gi;

function stripNofollow(html) {
    if (!html || typeof html !== 'string' || !/nofollow/i.test(html)) return html;
    return html.replace(REL_RE, (_match, value) => {
        const tokens = value
            .split(/\s+/)
            .filter(t => t && t.toLowerCase() !== 'nofollow');
        return tokens.length ? ` rel="${tokens.join(' ')}"` : '';
    });
}

// Collections + fields where HTML lives. Extend if you add more rich-text
// surfaces — the script only touches fields it finds.
const TARGETS = [
    { collection: 'blog_posts', fields: ['content'] },
    { collection: 'projects', fields: ['content', 'detailedOverview'] },
    { collection: 'categories', fields: ['content', 'description'] },
];

(async () => {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    console.log(`DB: ${dbName}  (${dryRun ? 'DRY RUN — no writes' : 'LIVE'})\n`);

    let totalScanned = 0, totalUpdated = 0;

    for (const { collection, fields } of TARGETS) {
        const col = db.collection(collection);
        const docs = await col.find(
            { $or: fields.map(f => ({ [f]: /nofollow/i })) },
            { projection: { ...Object.fromEntries(fields.map(f => [f, 1])) } },
        ).toArray();

        console.log(`📂 ${collection}: ${docs.length} doc(s) with "nofollow" in tracked field(s)`);
        totalScanned += docs.length;

        for (const doc of docs) {
            const update = {};
            for (const field of fields) {
                const original = doc[field];
                const cleaned = stripNofollow(original);
                if (cleaned !== original) update[field] = cleaned;
            }
            if (Object.keys(update).length === 0) continue;

            if (dryRun) {
                console.log(`  • [dry] would update ${doc._id} fields: ${Object.keys(update).join(', ')}`);
            } else {
                update.updatedAt = new Date().toISOString();
                await col.updateOne({ _id: doc._id }, { $set: update });
                console.log(`  ✓ updated ${doc._id} fields: ${Object.keys(update).filter(k => k !== 'updatedAt').join(', ')}`);
            }
            totalUpdated++;
        }
        console.log('');
    }

    console.log('— Summary —');
    console.log(`   scanned : ${totalScanned}`);
    console.log(`   ${dryRun ? 'would update' : 'updated'} : ${totalUpdated}`);
    await client.close();
})().catch(e => { console.error('❌', e); process.exit(1); });
