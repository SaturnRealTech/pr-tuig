#!/usr/bin/env node
// Create or update an admin user directly in SQLite.
//
// Usage:
//   node scripts/create-user.mjs <email> <password> [name] [role]
//   role defaults to 'admin'.  role can be 'admin' | 'editor' | 'viewer'.
//
// Examples:
//   node scripts/create-user.mjs admin@saturn.in "S3cure!Pass"
//   node scripts/create-user.mjs editor@x.com "Pass1234" "Jane" editor
//
// If a user with the given email already exists, the password is reset to
// the new value (so this script doubles as a "reset password" tool).
//
// Honours SQLITE_PATH the same way the app does. Run locally to seed your
// own DB; run on the server via the hPanel Node.js terminal to seed prod.

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dbPath = process.env.SQLITE_PATH || path.join(root, 'data', 'data.db');

const [emailArg, passwordArg, nameArg, roleArg] = process.argv.slice(2);

if (!emailArg || !passwordArg) {
    console.error('usage: node scripts/create-user.mjs <email> <password> [name] [role]');
    process.exit(1);
}

const email = String(emailArg).trim().toLowerCase();
const password = String(passwordArg);
const name = nameArg || email.split('@')[0];
const role = ['admin', 'editor', 'viewer'].includes(roleArg) ? roleArg : 'admin';

if (password.length < 6) {
    console.error('password must be at least 6 characters');
    process.exit(1);
}

if (!fs.existsSync(dbPath)) {
    console.error(`[create-user] SQLite file missing at ${dbPath}`);
    console.error('Run `npm run db:init` first, or set SQLITE_PATH to the correct file.');
    process.exit(1);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Make sure the users table exists.
try {
    db.prepare('SELECT 1 FROM users LIMIT 1').get();
} catch {
    console.error('[create-user] `users` table does not exist. Run `npm run db:init` first.');
    process.exit(1);
}

const now = new Date().toISOString();
const hashedPassword = await bcrypt.hash(password, 10);

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
    db.prepare('UPDATE users SET password = ?, name = ?, role = ?, updatedAt = ? WHERE id = ?')
        .run(hashedPassword, name, role, now, existing.id);
    console.log(`✓ updated existing user  ${email}  (role: ${role})`);
} else {
    const _id = Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    db.prepare('INSERT INTO users (_id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
        .run(_id, name, email, hashedPassword, role, now);
    console.log(`✓ created user  ${email}  (role: ${role})`);
}

const row = db.prepare('SELECT id, _id, name, email, role, createdAt FROM users WHERE email = ?').get(email);
console.log(row);
db.close();
