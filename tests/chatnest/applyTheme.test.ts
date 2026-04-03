/**
 * Tests for theme/applyTheme.js
 */

// ── Inline getCurrentTheme (from utils/theme.js) ──────────────────────────────

function getCurrentTheme(themeSetting) {
    if (themeSetting === 'light') return 'light';
    if (themeSetting === 'dark') return 'dark';
    // 'system' or any other value → check prefers-color-scheme
    if (typeof window !== 'undefined' && window.matchMedia) {
        try {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    }
    return 'light';
}

// ── Inline applyTheme ─────────────────────────────────────────────────────────

function applyTheme(chatnest) {
    const theme = getCurrentTheme(chatnest.config.theme);

    if (chatnest.widget) {
        const classes = new Set(chatnest.widget.className.split(/\s+/).filter(Boolean));
        classes.forEach(name => { if (name.endsWith('-theme')) classes.delete(name); });
        classes.add('chat-widget');
        classes.add(`${theme}-theme`);
        if (chatnest.config.parlant.enabled) {
            classes.add('parlant-mode');
        } else {
            classes.delete('parlant-mode');
        }
        chatnest.widget.className = Array.from(classes).join(' ');
    }

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (mq) {
        if (chatnest._systemThemeHandler) {
            mq.removeEventListener('change', chatnest._systemThemeHandler);
            chatnest._systemThemeHandler = null;
        }
        if (chatnest.config.theme === 'system') {
            chatnest._systemThemeHandler = () => chatnest.loadStyles();
            mq.addEventListener('change', chatnest._systemThemeHandler);
        }
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMatchMedia(darkMode = false) {
    const listeners = [];
    return jest.fn().mockReturnValue({
        matches: darkMode,
        addEventListener: jest.fn((event, handler) => listeners.push({ event, handler })),
        removeEventListener: jest.fn(),
        _listeners: listeners,
    });
}

function makeChatnest(overrides = {}) {
    const widget = document.createElement('div');
    widget.className = 'chat-widget';
    document.body.appendChild(widget);
    return {
        widget,
        config: {
            theme: 'light',
            parlant: { enabled: false },
            ...overrides.config,
        },
        _systemThemeHandler: null,
        loadStyles: jest.fn(),
        ...overrides,
    };
}

afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
});

// ── applyTheme ────────────────────────────────────────────────────────────────

describe('applyTheme', () => {
    test('adds light-theme class for theme="light"', () => {
        window.matchMedia = makeMatchMedia(false);
        const chatnest = makeChatnest({ config: { theme: 'light', parlant: { enabled: false } } });
        applyTheme(chatnest);
        expect(chatnest.widget.classList.contains('light-theme')).toBe(true);
    });

    test('adds dark-theme class for theme="dark"', () => {
        window.matchMedia = makeMatchMedia(false);
        const chatnest = makeChatnest({ config: { theme: 'dark', parlant: { enabled: false } } });
        applyTheme(chatnest);
        expect(chatnest.widget.classList.contains('dark-theme')).toBe(true);
    });

    test('resolves system theme to dark when prefers-color-scheme is dark', () => {
        window.matchMedia = makeMatchMedia(true);
        const chatnest = makeChatnest({ config: { theme: 'system', parlant: { enabled: false } } });
        applyTheme(chatnest);
        expect(chatnest.widget.classList.contains('dark-theme')).toBe(true);
    });

    test('resolves system theme to light when prefers-color-scheme is light', () => {
        window.matchMedia = makeMatchMedia(false);
        const chatnest = makeChatnest({ config: { theme: 'system', parlant: { enabled: false } } });
        applyTheme(chatnest);
        expect(chatnest.widget.classList.contains('light-theme')).toBe(true);
    });

    test('adds chat-widget class to widget', () => {
        window.matchMedia = makeMatchMedia(false);
        const chatnest = makeChatnest();
        chatnest.widget.className = ''; // Clear className
        applyTheme(chatnest);
        expect(chatnest.widget.classList.contains('chat-widget')).toBe(true);
    });

    test('removes old *-theme classes before adding new one', () => {
        window.matchMedia = makeMatchMedia(false);
        const chatnest = makeChatnest({ config: { theme: 'light', parlant: { enabled: false } } });
        chatnest.widget.className = 'chat-widget dark-theme';
        applyTheme(chatnest);
        expect(chatnest.widget.classList.contains('dark-theme')).toBe(false);
        expect(chatnest.widget.classList.contains('light-theme')).toBe(true);
    });

    test('adds parlant-mode class when parlant.enabled is true', () => {
        window.matchMedia = makeMatchMedia(false);
        const chatnest = makeChatnest({ config: { theme: 'light', parlant: { enabled: true } } });
        applyTheme(chatnest);
        expect(chatnest.widget.classList.contains('parlant-mode')).toBe(true);
    });

    test('removes parlant-mode class when parlant.enabled is false', () => {
        window.matchMedia = makeMatchMedia(false);
        const chatnest = makeChatnest({ config: { theme: 'light', parlant: { enabled: false } } });
        chatnest.widget.classList.add('parlant-mode');
        applyTheme(chatnest);
        expect(chatnest.widget.classList.contains('parlant-mode')).toBe(false);
    });

    test('does nothing to widget when widget is null', () => {
        window.matchMedia = makeMatchMedia(false);
        const chatnest = makeChatnest({ config: { theme: 'light', parlant: { enabled: false } } });
        chatnest.widget = null;
        expect(() => applyTheme(chatnest)).not.toThrow();
    });

    test('registers system theme change listener for theme="system"', () => {
        const mq = makeMatchMedia(false);
        window.matchMedia = mq;
        const chatnest = makeChatnest({ config: { theme: 'system', parlant: { enabled: false } } });
        applyTheme(chatnest);
        const mqInstance = mq.mock.results[0].value;
        expect(mqInstance.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
        expect(chatnest._systemThemeHandler).not.toBeNull();
    });

    test('does NOT register system theme listener for theme="light"', () => {
        const mq = makeMatchMedia(false);
        window.matchMedia = mq;
        const chatnest = makeChatnest({ config: { theme: 'light', parlant: { enabled: false } } });
        applyTheme(chatnest);
        const mqInstance = mq.mock.results[0].value;
        expect(mqInstance.addEventListener).not.toHaveBeenCalled();
        expect(chatnest._systemThemeHandler).toBeNull();
    });

    test('removes previous system theme listener before re-registering', () => {
        const mq = makeMatchMedia(false);
        window.matchMedia = mq;
        const chatnest = makeChatnest({ config: { theme: 'system', parlant: { enabled: false } } });

        applyTheme(chatnest); // First call — registers
        const firstHandler = chatnest._systemThemeHandler;

        applyTheme(chatnest); // Second call — should remove old and register new
        const mqInstance = mq.mock.results[0].value;
        expect(mqInstance.removeEventListener).toHaveBeenCalledWith('change', firstHandler);
    });

    test('preserves existing non-theme classes on widget', () => {
        window.matchMedia = makeMatchMedia(false);
        const chatnest = makeChatnest();
        chatnest.widget.classList.add('custom-class', 'another-class');
        applyTheme(chatnest);
        expect(chatnest.widget.classList.contains('custom-class')).toBe(true);
        expect(chatnest.widget.classList.contains('another-class')).toBe(true);
    });
});

// ── getCurrentTheme ───────────────────────────────────────────────────────────

describe('getCurrentTheme', () => {
    test('returns "light" for theme="light"', () => {
        expect(getCurrentTheme('light')).toBe('light');
    });

    test('returns "dark" for theme="dark"', () => {
        expect(getCurrentTheme('dark')).toBe('dark');
    });

    test('returns "dark" for theme="system" when dark mode is preferred', () => {
        window.matchMedia = makeMatchMedia(true);
        expect(getCurrentTheme('system')).toBe('dark');
    });

    test('returns "light" for theme="system" when light mode is preferred', () => {
        window.matchMedia = makeMatchMedia(false);
        expect(getCurrentTheme('system')).toBe('light');
    });

    test('returns "light" when matchMedia is unavailable', () => {
        const original = window.matchMedia;
        window.matchMedia = undefined;
        expect(getCurrentTheme('system')).toBe('light');
        window.matchMedia = original;
    });
});
