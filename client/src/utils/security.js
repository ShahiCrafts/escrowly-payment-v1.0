import DOMPurify from 'dompurify';

/**
 * Sanitizes a string or HTML to prevent XSS.
 * Use this before rendering any dynamic content, especially if using dangerouslySetInnerHTML.
 * 
 * @param {string} dirty - The string or HTML to sanitize
 * @returns {string} - The sanitized string
 */
export const sanitize = (dirty) => {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'], // Strict subset for general use
        ALLOWED_ATTR: ['href', 'target', 'rel']
    });
};

/**
 * Pure text sanitizer (strips all tags)
 * @param {string} dirty 
 * @returns {string}
 */
export const stripHtml = (dirty) => {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};
