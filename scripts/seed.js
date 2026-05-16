// Database seeder script
// Run this with: node scripts/seed.js

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'Saturnrealcon';

if (!uri) {
    console.error('❌ Error: MONGODB_URI not found in .env');
    console.log('Please add your MongoDB connection string to .env');
    process.exit(1);
}

console.log('📡 Connecting to MongoDB...');

const blogPosts = [
    {
        id: 1,
        title: 'How AI is Revolutionizing SaaS Development',
        excerpt: 'Discover how artificial intelligence is transforming the way we build SaaS products and reducing development time by 70%.',
        category: 'AI & Technology',
        date: 'January 15, 2026',
        author: 'John Doe',
        readTime: '5 min read',
        image: '🤖',
        content: `
            <h2>Introduction</h2>
            <p>Artificial intelligence has become a game-changer in software development. What used to take months of coding and debugging can now be accomplished in weeks with AI-powered tools and methodologies.</p>

            <h2>The Current State of SaaS Development</h2>
            <p>Traditional SaaS development involves multiple stages: requirements gathering, design, development, testing, and deployment. Each phase can take weeks or even months.</p>

            <h2>How AI Changes The Game</h2>
            <p>AI-powered development tools can:</p>
            <ul>
                <li>Generate boilerplate code automatically</li>
                <li>Suggest optimizations in real-time</li>
                <li>Catch bugs before they reach production</li>
                <li>Write comprehensive test suites</li>
                <li>Deploy and monitor applications intelligently</li>
            </ul>

            <h2>Real World Impact</h2>
            <p>At Qwikly Launch, we've seen firsthand how AI reduces development time by up to 70%. Projects that would take 6 months now take 2-4 weeks.</p>

            <h2>The Future</h2>
            <p>As AI continues to evolve, we expect even more dramatic improvements in speed, quality, and cost-effectiveness of SaaS development.</p>
        `
    },
    {
        id: 2,
        title: 'The Future of Rapid Product Development',
        excerpt: 'From MVP to production-ready SaaS in weeks. Learn the strategies that are changing the game.',
        category: 'Product Development',
        date: 'January 12, 2026',
        author: 'Jane Smith',
        readTime: '7 min read',
        image: '⚡',
        content: '<p>Content for rapid product development...</p>'
    },
    {
        id: 3,
        title: 'Best Practices for Scaling Your SaaS',
        excerpt: 'Everything you need to know about scaling your SaaS application while maintaining performance.',
        category: 'Scaling',
        date: 'January 10, 2026',
        author: 'Mike Johnson',
        readTime: '8 min read',
        image: '📈',
        content: '<p>Content for scaling SaaS...</p>'
    },
    {
        id: 4,
        title: 'Cost Optimization Strategies for Startups',
        excerpt: 'How to build a world-class SaaS product without breaking the bank. Smart strategies for bootstrapped teams.',
        category: 'Startups',
        date: 'January 8, 2026',
        author: 'Sarah Davis',
        readTime: '6 min read',
        image: '💰',
        content: '<p>Content for cost optimization...</p>'
    },
    {
        id: 5,
        title: 'Security First: Building Secure SaaS Applications',
        excerpt: 'Security is not an afterthought. Learn how to build security into your SaaS from day one.',
        category: 'Security',
        date: 'January 5, 2026',
        author: 'Tom Wilson',
        readTime: '10 min read',
        image: '🔒',
        content: '<p>Content for security...</p>'
    },
    {
        id: 6,
        title: 'UX Design Trends in 2026',
        excerpt: 'The latest UX design trends that are making SaaS applications more user-friendly and engaging.',
        category: 'Design',
        date: 'January 3, 2026',
        author: 'Lisa Brown',
        readTime: '6 min read',
        image: '🎨',
        content: '<p>Content for UX design...</p>'
    }
];

const projects = [
    {
        id: 1,
        title: 'FinTech Dashboard Platform',
        client: 'FinFlow Inc.',
        industry: 'FinTech',
        year: '2025',
        description: 'A comprehensive financial dashboard built in 4 weeks. Real-time analytics, secure transactions, and AI-powered insights.',
        category: 'FinTech',
        results: '300% faster to market',
        technologies: ['React', 'Node.js', 'MongoDB', 'AI', 'AWS', 'Docker'],
        icon: '💰',
        fullDescription: 'FinFlow Inc. needed a modern, secure financial dashboard to serve their growing client base. The challenge was to build a production-ready platform in record time without compromising security or performance.',
        challenge: `
            <h3>The Challenge</h3>
            <p>FinFlow needed to:</p>
            <ul>
                <li>Build a secure financial platform handling millions of transactions</li>
                <li>Launch within 4 weeks to meet market demands</li>
                <li>Integrate with multiple payment gateways and banks</li>
                <li>Implement real-time analytics and reporting</li>
                <li>Ensure 99.99% uptime and compliance with financial regulations</li>
            </ul>
        `,
        solution: `
            <h3>Our Solution</h3>
            <p>We used a modern, scalable architecture:</p>
            <ul>
                <li><strong>Frontend:</strong> React with real-time data visualization using Chart.js</li>
                <li><strong>Backend:</strong> Node.js with Express for fast API development</li>
                <li><strong>Database:</strong> MongoDB for flexible schema and horizontal scaling</li>
                <li><strong>Security:</strong> End-to-end encryption, multi-factor authentication, and comprehensive audit logging</li>
                <li><strong>Infrastructure:</strong> AWS with auto-scaling and load balancing</li>
            </ul>
        `,
        resultsDetail: `
            <h3>Results Achieved</h3>
            <ul>
                <li>✓ Launched in exactly 4 weeks (vs. industry standard of 6+ months)</li>
                <li>✓ Handles 1M+ transactions per day with sub-100ms response times</li>
                <li>✓ 99.99% uptime in first year of operation</li>
                <li>✓ Passed all compliance audits (PCI-DSS, SOC 2)</li>
                <li>✓ Added 50K+ users within first quarter</li>
                <li>✓ $50M+ transaction volume processed</li>
            </ul>
        `,
        metrics: [
            { label: 'Development Time', value: '4 weeks' },
            { label: 'Transaction Volume', value: '$50M+' },
            { label: 'Daily Active Users', value: '50K+' },
            { label: 'System Uptime', value: '99.99%' }
        ]
    },
    {
        id: 2,
        title: 'E-Learning Management System',
        client: 'EduConnect',
        industry: 'EdTech',
        year: '2025',
        description: 'Complete learning platform with video hosting, progress tracking, and AI-powered recommendations.',
        category: 'EdTech',
        results: '50K+ active users',
        technologies: ['Next.js', 'PostgreSQL', 'AWS', 'OpenAI', 'Kubernetes', 'Mux'],
        icon: '📚',
        fullDescription: 'EduConnect wanted to revolutionize online education with a platform that adapts to each learner.',
        metrics: [
            { label: 'Active Users', value: '50K+' },
            { label: 'Video Delivery', value: '99.5% Uptime' },
            { label: 'Course Completion', value: '+35%' },
            { label: 'Countries Served', value: '20+' }
        ]
    },
    {
        id: 3,
        title: 'Healthcare Appointment Booking',
        client: 'MediCare Plus',
        description: 'Secure appointment booking system with patient management and automated notifications.',
        category: 'Healthcare',
        results: '10K+ monthly bookings',
        technologies: ['React', 'Express', 'MySQL', 'Stripe'],
        icon: '⚕️'
    },
    {
        id: 4,
        title: 'Project Management Tool',
        client: 'TeamSync',
        description: 'Collaborative project management platform with real-time updates, task automation, and team communication.',
        category: 'Productivity',
        results: '5000 teams using',
        technologies: ['Vue.js', 'Firebase', 'Websockets'],
        icon: '📊'
    },
    {
        id: 5,
        title: 'Social Commerce Platform',
        client: 'ShopHub',
        description: 'Social commerce marketplace connecting creators with customers. Built with AI-powered recommendations.',
        category: 'E-Commerce',
        results: '$2M GMV in year 1',
        technologies: ['React Native', 'Node.js', 'PostgreSQL', 'Stripe'],
        icon: '🛍️'
    },
    {
        id: 6,
        title: 'Content Management System',
        client: 'PublishCo',
        description: 'Enterprise CMS with content scheduling, version control, and multi-language support.',
        category: 'Enterprise',
        results: '500+ organizations',
        technologies: ['Next.js', 'Contentful', 'Vercel'],
        icon: '📝'
    }
];

const careers = [
    {
        title: 'Senior Full Stack Developer',
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
        description: 'Build scalable SaaS products with modern tech stack. Experience with React, Node.js, and cloud infrastructure required.'
    },
    {
        title: 'AI/ML Engineer',
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
        description: 'Develop AI-powered features and integrations. Experience with Python, TensorFlow, and LLMs preferred.'
    },
    {
        title: 'Product Manager',
        department: 'Product',
        location: 'Hybrid',
        type: 'Full-time',
        description: 'Lead product strategy and roadmap. Drive feature development and customer success initiatives.'
    },
    {
        title: 'Sales Development Representative',
        department: 'Sales',
        location: 'Remote',
        type: 'Full-time',
        description: 'Identify and qualify leads. Build relationships with potential clients in the SaaS space.'
    },
    {
        title: 'UX/UI Designer',
        department: 'Design',
        location: 'Remote',
        type: 'Full-time',
        description: 'Design beautiful and intuitive user interfaces. Experience with Figma and design systems required.'
    },
    {
        title: 'DevOps Engineer',
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
        description: 'Build and maintain CI/CD pipelines. Experience with Kubernetes, Docker, and AWS required.'
    }
];

const testimonials = [
    {
        name: 'Sarah Johnson',
        company: 'TechStart Inc.',
        position: 'CEO',
        avatar: 'SJ',
        rating: 5,
        text: 'Qwikly Launch delivered our MVP in just 2 weeks. The speed and quality exceeded our expectations. They\'re now our go-to development partner.'
    },
    {
        name: 'Marcus Chen',
        company: 'DataPulse',
        position: 'CEO',
        avatar: 'MC',
        rating: 5,
        text: 'The AI integration they built for us increased our user engagement by 40%. Incredible technical expertise and lightning-fast delivery.'
    },
    {
        name: 'Emily Rodriguez',
        company: 'CloudSync Solutions',
        position: 'CTO',
        avatar: 'ER',
        rating: 5,
        text: 'Best development experience we\'ve had. Professional, fast, and the final product was exactly what we envisioned. Highly recommend!'
    }
];

async function seedDatabase() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);

        // Clear existing data
        console.log('Clearing existing data...');
        await db.collection('blog_posts').deleteMany({});
        await db.collection('projects').deleteMany({});
        await db.collection('careers').deleteMany({});
        await db.collection('testimonials').deleteMany({});

        // Insert blog posts
        console.log('Seeding blog posts...');
        const blogResult = await db.collection('blog_posts').insertMany(blogPosts);
        console.log(`✓ Inserted ${blogResult.insertedCount} blog posts`);

        // Insert projects
        console.log('Seeding projects...');
        const projectsResult = await db.collection('projects').insertMany(projects);
        console.log(`✓ Inserted ${projectsResult.insertedCount} projects`);

        // Insert careers
        console.log('Seeding careers...');
        const careersResult = await db.collection('careers').insertMany(careers);
        console.log(`✓ Inserted ${careersResult.insertedCount} career positions`);

        // Insert testimonials
        console.log('Seeding testimonials...');
        const testimonialsResult = await db.collection('testimonials').insertMany(testimonials);
        console.log(`✓ Inserted ${testimonialsResult.insertedCount} testimonials`);

        console.log('\n✅ Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await client.close();
    }
}

seedDatabase();
