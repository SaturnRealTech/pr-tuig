const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

async function addSlugsToBlogs() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const collection = db.collection('blog_posts');

        // Find all blogs without slugs
        const blogsWithoutSlugs = await collection.find({
            $or: [
                { slug: { $exists: false } },
                { slug: '' },
                { slug: null }
            ]
        }).toArray();

        console.log(`Found ${blogsWithoutSlugs.length} blogs without slugs`);

        for (const blog of blogsWithoutSlugs) {
            const slug = generateSlug(blog.title);

            // Check if slug already exists
            const existingSlug = await collection.findOne({ slug, _id: { $ne: blog._id } });

            let finalSlug = slug;
            let counter = 1;

            // If slug exists, append a number
            while (existingSlug) {
                finalSlug = `${slug}-${counter}`;
                const check = await collection.findOne({ slug: finalSlug, _id: { $ne: blog._id } });
                if (!check) break;
                counter++;
            }

            // Update the blog with the slug
            await collection.updateOne(
                { _id: blog._id },
                { $set: { slug: finalSlug } }
            );

            console.log(`Updated blog "${blog.title}" with slug: ${finalSlug}`);
        }

        console.log('✅ All blogs updated with slugs!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

addSlugsToBlogs();
