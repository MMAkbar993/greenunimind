import DOMPurify from 'dompurify';

/**
 * Safely renders rich text content from editors like ReactQuill
 * Handles both HTML content and markdown-style content
 * Includes sanitization to prevent XSS attacks
 */
export const renderRichText = (content: string | undefined | null): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // First, check if content is already HTML (contains HTML tags)
  const hasHtmlTags = /<[^>]*>/g.test(content);
  
  let processedContent = content;

  // If it's not HTML, convert markdown-style formatting to HTML
  if (!hasHtmlTags) {
    processedContent = content
      // Convert line breaks to <br> tags
      .replace(/\n/g, '<br />')
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *italic* to <em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert ### to h3
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mb-2 mt-4">$1</h3>')
      // Convert ## to h2
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-5">$1</h2>')
      // Convert # to h1
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mb-4 mt-6">$1</h1>')
      // Convert `code` to inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Convert [link](url) to anchor tags
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-green-600 hover:text-green-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(processedContent, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class'
    ],
    ALLOW_DATA_ATTR: false
  });

  return sanitizedContent;
};

/**
 * Renders rich text content specifically for course descriptions
 * Applies consistent styling for course content
 */
export const renderCourseDescription = (description: string | undefined | null): string => {
  const rendered = renderRichText(description);
  
  if (!rendered) {
    return '<p class="text-gray-500 italic">No description available</p>';
  }

  // Wrap in a container with consistent prose styling
  return `<div class="prose prose-gray max-w-none text-gray-700 leading-relaxed">${rendered}</div>`;
};

/**
 * Strips HTML tags and returns plain text for previews
 */
export const getPlainTextFromRichText = (content: string | undefined | null): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove HTML tags and decode entities
  const plainText = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Decode ampersands
    .replace(/&lt;/g, '<') // Decode less than
    .replace(/&gt;/g, '>') // Decode greater than
    .replace(/&quot;/g, '"') // Decode quotes
    .replace(/&#39;/g, "'") // Decode apostrophes
    .trim();

  return plainText;
};
