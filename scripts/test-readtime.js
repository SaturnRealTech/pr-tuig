// Test script for read time calculation
const { calculateReadTime } = require('../src/utils/readTime');

// Test cases
const tests = [
    {
        name: 'Empty content',
        html: '',
        expected: '1 min read'
    },
    {
        name: 'Short content (50 words)',
        html: '<p>' + 'word '.repeat(50) + '</p>',
        expectedMin: '1 min read'
    },
    {
        name: 'Medium content (200 words)',
        html: '<p>' + 'word '.repeat(200) + '</p>',
        expectedMin: '1 min read'
    },
    {
        name: 'Long content (500 words)',
        html: '<p>' + 'word '.repeat(500) + '</p>',
        expectedMin: '3 min read'
    },
    {
        name: 'Very long content (1000 words)',
        html: '<p>' + 'word '.repeat(1000) + '</p>',
        expectedMin: '5 min read'
    },
    {
        name: 'Content with HTML tags',
        html: '<h1>Title</h1><p>This is a <strong>test</strong> with <em>formatting</em>.</p><ul><li>Item 1</li><li>Item 2</li></ul>' + '<p>' + 'word '.repeat(400) + '</p>',
        expectedApprox: 2 // Should be around 2 min
    }
];

console.log('Testing Read Time Calculation\n' + '='.repeat(50) + '\n');

tests.forEach(test => {
    const result = calculateReadTime(test.html);
    console.log(`Test: ${test.name}`);
    console.log(`Result: ${result}`);
    if (test.expected) {
        console.log(`Expected: ${test.expected}`);
        console.log(`Status: ${result === test.expected ? '✓ PASS' : '✗ FAIL'}`);
    } else {
        console.log(`Expected approximately: ${test.expectedApprox} min`);
        console.log(`Status: ${result.includes(test.expectedApprox.toString()) || result.includes((test.expectedApprox + 1).toString()) ? '✓ PASS' : '✗ FAIL'}`);
    }
    console.log('');
});

// Test with actual blog content
const blogContent = `
<h1>Building a Modern Web Application</h1>
<p>Creating a modern web application requires careful consideration of many factors. From choosing the right framework to implementing best practices in code organization, every decision matters.</p>
<p>In this comprehensive guide, we'll explore the key aspects of building scalable and maintainable web applications. We'll cover topics such as:</p>
<ul>
<li>Architecture patterns</li>
<li>State management</li>
<li>Performance optimization</li>
<li>Security best practices</li>
</ul>
<p>` + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50) + `</p>
<h2>Getting Started</h2>
<p>` + 'When building a web application, the first step is to plan your architecture. '.repeat(30) + `</p>
`;

console.log('='.repeat(50));
console.log('Realistic Blog Post Test:');
console.log(`Result: ${calculateReadTime(blogContent)}`);
console.log('='.repeat(50));
