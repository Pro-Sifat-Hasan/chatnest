/**
 * Tests for src/lib/utils/theme.js
 */

const {
    getCurrentTheme,
    getThemeColor,
    formatTimestamp,
} = require('../../src/lib/utils/theme.js');

// jsdom does not implement window.matchMedia — provide a stub
beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query) => ({
            matches: false, // jsdom always = light
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    });
});

describe('getCurrentTheme', () => {
    test('returns "light" for light setting', () => {
        expect(getCurrentTheme('light')).toBe('light');
    });

    test('returns "dark" for dark setting', () => {
        expect(getCurrentTheme('dark')).toBe('dark');
    });

    test('returns system theme when set to system (jsdom stub returns light)', () => {
        expect(getCurrentTheme('system')).toBe('light');
    });

    test('returns the raw value for unknown settings', () => {
        expect(getCurrentTheme('custom')).toBe('custom');
    });
});

describe('getThemeColor', () => {
    test('returns light bg color', () => {
        expect(getThemeColor('bg', 'light')).toBe('#ffffff');
    });

    test('returns dark bg color', () => {
        expect(getThemeColor('bg', 'dark')).toBe('#1a1a1a');
    });

    test('returns dark text color', () => {
        expect(getThemeColor('text', 'dark')).toBe('#ffffff');
    });

    test('falls back to light theme for unknown theme', () => {
        expect(getThemeColor('bg', 'neon')).toBe('#ffffff');
    });

    test('returns light value for unknown color type in light theme', () => {
        expect(getThemeColor('nonexistent', 'light')).toBeUndefined();
    });
});

describe('formatTimestamp', () => {
    test('returns non-empty string for valid ISO timestamp', () => {
        const result = formatTimestamp('2024-01-15T10:30:00.000Z');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    test('returns non-empty string for null (uses current time)', () => {
        const result = formatTimestamp(null);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    test('returns empty string for invalid date string', () => {
        expect(formatTimestamp('not-a-date')).toBe('');
    });

    test('returns non-empty string for undefined (uses current time)', () => {
        const result = formatTimestamp(undefined);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    test('formats time in HH:MM format (2 colons, digits around)', () => {
        const result = formatTimestamp('2024-06-01T14:05:00.000Z');
        expect(result).toMatch(/\d{1,2}[:]\d{2}/);
    });
});
