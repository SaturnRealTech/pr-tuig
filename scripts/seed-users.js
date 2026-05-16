const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'Saturnrealcon';

if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

const users = [
    {
        name: 'Super Admin',
        email: 'admin@saturnrealcon.com',
        password: 'Admin@123',
        role: 'admin',
    },
    {
        name: 'Dharmendra Singh Yadav',
        email: 'dharmendrasinghyadav022@gmail.com',
        password: 'Dharm@123',
        role: 'admin',
    },
];

async function seedUsers() {
    const client = new MongoClient(uri, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        serverSelectionTimeoutMS: 15000,
    });

    try {
        console.log('📡 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected');

        const db = client.db(dbName);

        for (const user of users) {
            const existing = await db.collection('users').findOne({ email: user.email });
            if (existing) {
                console.log(`⚠️  User already exists: ${user.email} — skipping`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(user.password, 12);
            await db.collection('users').insertOne({
                name: user.name,
                email: user.email,
                password: hashedPassword,
                role: user.role,
                createdAt: new Date(),
            });

            console.log(`✅ Created user: ${user.email}  |  password: ${user.password}  |  role: ${user.role}`);
        }

        console.log('\n🎉 Done! Use these credentials to log in:\n');
        users.forEach(u => {
            console.log(`  Email   : ${u.email}`);
            console.log(`  Password: ${u.password}`);
            console.log(`  Role    : ${u.role}\n`);
        });
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.close();
    }
}

seedUsers();
