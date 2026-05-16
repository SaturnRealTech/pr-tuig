/**
 * Calculate estimated reading time based on text content
 * @param {string} html - HTML content from TipTap editor
 * @returns {string} - Formatted read time string (e.g., "5 min read")
 */
export function calculateReadTime(html) {
    if (!html || typeof html !== 'string') {
        return '1 min read';
    }

    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, ' ');

    // Remove extra whitespace and get word count
    const words = text
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .filter(word => word.length > 0);

    const wordCount = words.length;

    // Average reading speed: 200 words per minute
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    // Return formatted string
    if (minutes < 1) {
        return '1 min read';
    } else if (minutes === 1) {
        return '1 min read';
    } else {
        return `${minutes} min read`;
    }
}
