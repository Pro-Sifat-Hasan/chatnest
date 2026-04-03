/**
 * Constrain greeting message width to match other bot messages (80% container width).
 * Uses a single rAF pass — previous multi-pass approach computed styles that were
 * always immediately overridden by the final 80% defaults, so it was simplified here.
 * @param {Chatnest} chatnest   - Chatnest instance
 * @param {Element}  greetingRow - Greeting row element
 */
export function synchronizeGreetingWidth(chatnest: any, greetingRow: any) {
    requestAnimationFrame(() => {
        const greetingMessage   = greetingRow?.querySelector('.bot-message');
        const greetingContainer = greetingRow?.querySelector('.bot-message-container');
        if (!greetingMessage || !greetingContainer) return;

        greetingContainer.style.setProperty('max-width', '80%', 'important');
        greetingContainer.style.setProperty('width',     '80%', 'important');
        greetingMessage.style.setProperty('max-width',   '100%', 'important');
        greetingMessage.style.setProperty('width',       '100%', 'important');
    });
}
