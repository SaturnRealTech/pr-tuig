// Run: node scripts/create-admin.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'Saturnrealcon';

if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

const ADMIN = {
    name: 'Dharmendra Singh Yadav',
    email: 'dharmendrasinghyadav022@gmail.com',
    password: 'Saturn@2026!',
    role: 'admin',
};

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);

        const existing = await db.collection('users').findOne({ email: ADMIN.email });
        if (existing) {
            console.log('⚠️  User already exists:', ADMIN.email);
            return;
        }

        const hashed = await bcrypt.hash(ADMIN.password, 10);
        await db.collection('users').insertOne({
            name: ADMIN.name,
            email: ADMIN.email,
            password: hashed,
            role: ADMIN.role,
            createdAt: new Date(),
        });

        console.log('✅ Admin created successfully!');
        console.log('   Email   :', ADMIN.email);
        console.log('   Password:', ADMIN.password);
        console.log('   Role    :', ADMIN.role);
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await client.close();
    }
}

run();
