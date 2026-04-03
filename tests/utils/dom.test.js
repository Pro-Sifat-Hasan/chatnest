/**
 * Tests for src/lib/utils/dom.js
 * formatFileSize, isMobileBrowser, escapeHtml
 * (loadScript requires real DOM and is not pure — covered via integration)
 */

const { formatFileSize, isMobileBrowser, escapeHtml } = require('../../src/lib/utils/dom.js');

// ── formatFileSize ────────────────────────────────────────────────────────────

describe('formatFileSize', () => {
    test('returns "0 Bytes" for 0', () => expect(formatFileSize(0)).toBe('0 Bytes'));
    test('returns Bytes for < 1024', () => expect(formatFileSize(500)).toBe('500 Bytes'));
    test('returns exactly 1 KB for 1024', () => expect(formatFileSize(1024)).toBe('1 KB'));
    test('returns 1.5 KB for 1536', () => expect(formatFileSize(1536)).toBe('1.5 KB'));
    test('returns MB for 1 MB', () => expect(formatFileSize(1024 * 1024)).toBe('1 MB'));
    test('returns correct MB value', () => expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB'));
    test('returns GB for 1 GB', () => expect(formatFileSize(1024 ** 3)).toBe('1 GB'));
    test('rounds to 2 decimal places', () => {
        const result = formatFileSize(1234);
        expect(result).toBe('1.21 KB');
    });
    test('returns Bytes for 1 byte', () => expect(formatFileSize(1)).toBe('1 Bytes'));
    test('returns 1023 Bytes', () => expect(formatFileSize(1023)).toBe('1023 Bytes'));
});

// ── isMobileBrowser ───────────────────────────────────────────────────────────

describe('isMobileBrowser', () => {
    const originalUA = navigator.userAgent;

    afterEach(() => {
        Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
    });

    function setUA(ua) {
        Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
    }

    test('returns false for desktop Chrome UA', () => {
        setUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120');
        expect(isMobileBrowser()).toBe(false);
    });

    test('returns true for Android UA', () => {
        setUA('Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Mobile Safari/537.36');
        expect(isMobileBrowser()).toBe(true);
    });

    test('returns true for iPhone UA', () => {
        setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
        expect(isMobileBrowser()).toBe(true);
    });

    test('returns true for iPad UA', () => {
        setUA('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
        expect(isMobileBrowser()).toBe(true);
    });

    test('returns true for BlackBerry UA', () => {
        setUA('BlackBerry9700 AppleWebKit/534.8');
        expect(isMobileBrowser()).toBe(true);
    });

    test('returns true for Opera Mini', () => {
        setUA('Opera/9.80 (J2ME/MIDP; Opera Mini/9.80; U; en)');
        expect(isMobileBrowser()).toBe(true);
    });

    test('returns true for IEMobile', () => {
        setUA('Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0)');
        expect(isMobileBrowser()).toBe(true);
    });
});

// ── escapeHtml ────────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
    test('escapes < and >', () => {
        expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    });

    test('escapes ampersand', () => {
        expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    test('does not encode double quotes (textContent/innerHTML does not encode them)', () => {
        expect(escapeHtml('"quoted"')).toBe('"quoted"');
    });

    test('escapes script tag', () => {
        const result = escapeHtml('<script>alert(1)</script>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });

    test('returns empty string for null', () => {
        expect(escapeHtml(null)).toBe('');
    });

    test('returns empty string for undefined', () => {
        expect(escapeHtml(undefined)).toBe('');
    });

    test('returns plain text unchanged', () => {
        expect(escapeHtml('Hello world')).toBe('Hello world');
    });

    test('converts non-string to string first', () => {
        expect(escapeHtml(42)).toBe('42');
    });

    test('handles empty string', () => {
        expect(escapeHtml('')).toBe('');
    });

    test('escapes multiple special chars in one string', () => {
        const result = escapeHtml('<a href="x">Link & more</a>');
        expect(result).toContain('&lt;a');
        expect(result).toContain('&amp;');
        expect(result).not.toContain('<a');
    });
});
