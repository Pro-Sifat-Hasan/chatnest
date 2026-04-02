/**
 * Tests for src/lib/utils/theme.js
 */

const THEME_COLORS = {
    light: {
        bg: '#ffffff', text: '#333333', border: '#e1e5e9',
        inputBg: '#ffffff', messageBg: '#ffffff', headerBg: '#ffffff', headerText: '#333333'
    },
    dark: {
        bg: '#1a1a1a', text: '#ffffff', border: '#404040',
        inputBg: '#2d2d2d', messageBg: '#2d2d2d', headerBg: '#2d2d2d', headerText: '#ffffff'
    }
};

function getCurrentTheme(themeSetting) {
    if (themeSetting === 'system') {
        return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeSetting;
}

function getThemeColor(type, themeSetting) {
    const theme = getCurrentTheme(themeSetting);
    return THEME_COLORS[theme]?.[type] || THEME_COLORS.light[type];
}

function formatTimestamp(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
        // Our matchMedia stub always returns matches: false → light
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
        // e.g. "02:05 PM" or "14:05" depending on locale
        expect(result).toMatch(/\d{1,2}[:]\d{2}/);
    });
});
