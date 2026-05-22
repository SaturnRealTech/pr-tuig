#!/usr/bin/env node
// Diagnostic: which project does the homepage actually load, and does it
// have any masterPlans / floorPlans on it?

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
if (!uri || !dbName) {
    console.error('MONGODB_URI / DB_NAME missing in env');
    process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const projects = db.collection('projects');

const homepage = await projects.findOne({ publishStatus: 'published', isHomePage: true })
    || await projects.findOne({ publishStatus: 'published' }, { sort: { createdAt: 1 } });

if (!homepage) {
    console.log('No published project found — the homepage will be empty.');
    process.exit(0);
}

const m = homepage.masterFloorPlan || {};
const masters = Array.isArray(m.masterPlans) ? m.masterPlans : [];
const floors = Array.isArray(m.floorPlans) ? m.floorPlans : [];
const isValid = (p) => !!(p?.image || p?.label || p?.alt);

console.log('\nHomepage project:');
console.log('  _id          :', String(homepage._id));
console.log('  title        :', homepage.title);
console.log('  slug         :', homepage.slug);
console.log('  isHomePage   :', !!homepage.isHomePage);
console.log('  publishStatus:', homepage.publishStatus);
console.log('  hideMFP      :', !!homepage.hideMasterFloorPlan);
console.log('\nMaster plans :', masters.length, ' (valid:', masters.filter(isValid).length + ')');
masters.slice(0, 5).forEach((p, i) => console.log(`   [${i}]`, JSON.stringify({ image: p?.image, label: p?.label, alt: p?.alt })));
console.log('\nFloor plans  :', floors.length, ' (valid:', floors.filter(isValid).length + ')');
floors.slice(0, 5).forEach((p, i) => console.log(`   [${i}]`, JSON.stringify({ image: p?.image, label: p?.label, alt: p?.alt })));

console.log('\n--- Other published projects with plans data ---');
const others = await projects.find(
    { publishStatus: 'published', _id: { $ne: homepage._id } },
    { projection: { title: 1, slug: 1, isHomePage: 1, masterFloorPlan: 1 } }
).toArray();
for (const p of others) {
    const mm = p.masterFloorPlan || {};
    const mCount = Array.isArray(mm.masterPlans) ? mm.masterPlans.filter(isValid).length : 0;
    const fCount = Array.isArray(mm.floorPlans) ? mm.floorPlans.filter(isValid).length : 0;
    if (mCount > 0 || fCount > 0) {
        console.log(`  - ${p.title} (slug: ${p.slug}, isHomePage: ${!!p.isHomePage}) — masters: ${mCount}, floors: ${fCount}`);
    }
}

await client.close();
