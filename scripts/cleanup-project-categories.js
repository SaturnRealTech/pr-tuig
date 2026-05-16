const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'Saturnrealcon';

async function cleanupProjectCategories() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);

        // Drop the projectCategories collection
        try {
            await db.collection('projectCategories').drop();
            console.log('✅ Dropped projectCategories collection');
        } catch (error) {
            if (error.message.includes('ns not found')) {
                console.log('ℹ️  projectCategories collection does not exist');
            } else {
                throw error;
            }
        }

        console.log('\n✅ Cleanup complete! Projects will now use blog categories.');
        console.log('📝 You can manage categories at: /admin/categories');

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await client.close();
        console.log('\nDatabase connection closed');
    }
}

cleanupProjectCategories();
