#!/usr/bin/env node
// One-shot: set (or rotate) the leads vault password directly in Mongo.
// Usage: node scripts/set-leads-password.mjs <password>

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 6) {
    console.error('Usage: node scripts/set-leads-password.mjs <password (>=6 chars)>');
    process.exit(1);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
if (!uri || !dbName) { console.error('MONGODB_URI / DB_NAME missing'); process.exit(1); }

const client = new MongoClient(uri);
await client.connect();
const settings = client.db(dbName).collection('settings');

const hash = await bcrypt.hash(password, 12);
const salt = crypto.randomBytes(16).toString('base64');
const now = new Date().toISOString();

const existing = await settings.findOne({ type: 'brand' });
const blob = { ...(existing?.data || {}), leadsPasswordHash: hash, leadsSalt: salt };
const payload = { data: blob, updatedAt: now };
if (!existing) payload.createdAt = now;

await settings.updateOne(
    { type: 'brand' },
    { $set: { type: 'brand', ...payload } },
    { upsert: true },
);

// Wipe any active unlock sessions so the new password takes effect immediately
// for anyone already holding a cookie.
try {
    await client.db(dbName).collection('lead_sessions').deleteMany({});
} catch { /* collection might not exist yet */ }

console.log('Leads vault password set. bcrypt hash + per-install salt written. Existing sessions cleared.');
await client.close();
