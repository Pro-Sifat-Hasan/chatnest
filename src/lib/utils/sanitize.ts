// @ts-nocheck
/**
 * Lightweight HTML sanitizer for marked.parse() output.
 * Strips script/iframe/embed/object/form tags and dangerous event/href attributes
 * without requiring an external dependency.
 *
 * If DOMPurify is available on window it will be used instead (stricter).
 */

// Tags that are unconditionally removed (along with their children)
const BLOCKED_TAGS = new Set([
    'script', 'style', 'iframe', 'frame', 'frameset',
    'object', 'embed', 'applet', 'base', 'form', 'input',
    'button', 'select', 'textarea', 'link', 'meta', 'noscript',
    'template', 'slot', 'canvas', 'svg',
]);

// Attribute names that are always removed on any tag
const BLOCKED_ATTRS = /^on|^srcdoc$|^data:$|^formaction$|^action$/i;

// Protocols allowed in href/src attributes
const SAFE_PROTOCOLS = /^(https?:|ftp:|mailto:|tel:|#|\/|\.)/i;

/**
 * Sanitize an HTML string before inserting into the DOM.
 * @param {string} html - Raw HTML (e.g. from marked.parse)
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHtml(html) {
    // Prefer DOMPurify if the host page already loads it
    if (typeof window !== 'undefined' && window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
        return window.DOMPurify.sanitize(html, {
            FORBID_TAGS: [...BLOCKED_TAGS],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
            ALLOW_DATA_ATTR: false,
        });
    }

    const template = document.createElement('template');
    template.innerHTML = html;
    sanitizeNode(template.content);
    return template.innerHTML;
}

function sanitizeNode(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const tag = child.tagName.toLowerCase();
            if (BLOCKED_TAGS.has(tag)) {
                child.remove();
                continue;
            }
            // Remove unsafe attributes
            const attrs = Array.from(child.attributes);
            for (const attr of attrs) {
                const name = attr.name.toLowerCase();
                const value = attr.value;
                if (BLOCKED_ATTRS.test(name)) {
                    child.removeAttribute(attr.name);
                    continue;
                }
                // Strip javascript: and data: URIs from link/src attributes
                if ((name === 'href' || name === 'src' || name === 'action') &&
                    value && !SAFE_PROTOCOLS.test(value.trim())) {
                    child.removeAttribute(attr.name);
                }
            }
            // Force external links to open safely
            if (tag === 'a') {
                const href = child.getAttribute('href') || '';
                if (href.startsWith('http') || href.startsWith('//')) {
                    child.setAttribute('target', '_blank');
                    child.setAttribute('rel', 'noopener noreferrer');
                }
            }
            sanitizeNode(child);
        }
    }
}
