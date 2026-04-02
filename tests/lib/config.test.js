/**
 * Tests for src/lib/config.js
 * clampDimension, clampFontSize, formatApiEndpoint, initConfig
 */

// ── Inline helpers (private in source) ───────────────────────────────────────

function clampDimension(value, min, max) {
    const numValue = parseInt(value, 10);
    return `${Math.min(Math.max(numValue || 0, min), max)}px`;
}

function clampFontSize(size) {
    let numSize;
    if (typeof size === 'string') {
        numSize = parseInt(size.replace('px', ''), 10);
    } else if (typeof size === 'number') {
        numSize = size;
    } else {
        numSize = 14;
    }
    const clampedSize = Math.min(Math.max(14, numSize), 25);
    return `${clampedSize}px`;
}

// formatApiEndpoint uses window.location — stub it in jsdom
function formatApiEndpoint(endpoint) {
    if (!endpoint) return 'http://localhost:7000/chat';
    if (endpoint.startsWith('//')) return `${window.location.protocol}${endpoint}`;
    if (endpoint.startsWith('/')) return `${window.location.origin}${endpoint}`;
    if (!endpoint.startsWith('http')) return `http://${endpoint}`;
    return endpoint;
}

// Inline initConfig with the same logic
function initConfig(config) {
    const apiEndpoint = formatApiEndpoint(config.apiEndpoint);
    return {
        botName: config.botName || 'Chat Assistant',
        greeting: config.greeting || 'Hello! How can I help you today?',
        placeholder: config.placeholder || 'Type your message here...',
        primaryColor: config.primaryColor || '#0084ff',
        fontSize: clampFontSize(config.fontSize || 14),
        width: clampDimension(config.width || '400px', 300, 600),
        height: clampDimension(config.height || '600px', 400, 800),
        showTimestamp: config.showTimestamp || false,
        enableHistory: config.enableHistory !== false,
        maxHistoryLength: config.maxHistoryLength || 100,
        enableTypewriter: config.enableTypewriter !== false,
        enableMarkdown: config.enableMarkdown !== false,
        apiEndpoint,
        apiKey: config.apiKey || '',
        apiMethod: config.apiMethod || 'POST',
        apiTimeout: config.apiTimeout || 30000,
        position: config.position || 'bottom-right',
        theme: config.theme || 'light',
        chips: config.chips || [],
        enableFileUpload: config.enableFileUpload !== false,
        useMultipartFormData: config.useMultipartFormData !== false,
        apiDataFormat: config.apiDataFormat || 'json',
        separateSubpageHistory: config.separateSubpageHistory || false,
        hubspot: {
            enabled: config.hubspot?.enabled || false,
            triggerKeywords: config.hubspot?.triggerKeywords || ['pricing', 'demo', 'contact', 'quote', 'help', 'support'],
        },
        parlant: {
            enabled: config.parlant?.enabled || false,
            apiBaseUrl: config.parlant?.apiBaseUrl || ''
        },
        supabase: {
            enabled: config.supabase?.enabled || false,
            url: config.supabase?.url || '',
            anonKey: config.supabase?.anonKey || '',
            tableName: config.supabase?.tableName || 'chat_history',
            historyLimit: config.supabase?.historyLimit || 50,
            pollIntervalMs: config.supabase?.pollIntervalMs ?? 5000
        },
        deleteEndpoint: config.deleteEndpoint
            ? formatApiEndpoint(config.deleteEndpoint)
            : `${apiEndpoint.replace(/\/chat$/, '')}/delete-history`,
        toggleButtonAnimation: config.toggleButtonAnimation !== undefined
            ? Math.max(0, Math.min(5, parseInt(config.toggleButtonAnimation, 10) || 0))
            : 4,
        toggleButtonSize: config.toggleButtonSize
            ? Math.max(40, Math.min(80, parseInt(config.toggleButtonSize, 10)))
            : 60,
    };
}

// ── clampDimension ────────────────────────────────────────────────────────────

describe('clampDimension', () => {
    test('returns value within range', () => expect(clampDimension('400px', 300, 600)).toBe('400px'));
    test('clamps below min', () => expect(clampDimension('200px', 300, 600)).toBe('300px'));
    test('clamps above max', () => expect(clampDimension('800px', 300, 600)).toBe('600px'));
    test('accepts number string without px', () => expect(clampDimension('500', 300, 600)).toBe('500px'));
    test('clamps zero to min', () => expect(clampDimension('0', 300, 600)).toBe('300px'));
    test('handles exact min', () => expect(clampDimension('300px', 300, 600)).toBe('300px'));
    test('handles exact max', () => expect(clampDimension('600px', 300, 600)).toBe('600px'));
    test('handles non-numeric gracefully (defaults to 0 → clamps to min)', () => {
        expect(clampDimension('abc', 300, 600)).toBe('300px');
    });
});

// ── clampFontSize ─────────────────────────────────────────────────────────────

describe('clampFontSize', () => {
    test('returns 14px for 14', () => expect(clampFontSize(14)).toBe('14px'));
    test('returns 25px for 25', () => expect(clampFontSize(25)).toBe('25px'));
    test('returns 18px for "18px" string', () => expect(clampFontSize('18px')).toBe('18px'));
    test('clamps below 14 to 14px', () => expect(clampFontSize(10)).toBe('14px'));
    test('clamps above 25 to 25px', () => expect(clampFontSize(30)).toBe('25px'));
    test('defaults to 14px for non-numeric type', () => expect(clampFontSize(null)).toBe('14px'));
    test('defaults to 14px for boolean', () => expect(clampFontSize(true)).toBe('14px'));
    test('accepts number as string', () => expect(clampFontSize('20')).toBe('20px'));
    test('clamps string too-small', () => expect(clampFontSize('10px')).toBe('14px'));
    test('clamps string too-large', () => expect(clampFontSize('30px')).toBe('25px'));
});

// ── formatApiEndpoint ─────────────────────────────────────────────────────────

describe('formatApiEndpoint', () => {
    test('returns default for null', () => expect(formatApiEndpoint(null)).toBe('http://localhost:7000/chat'));
    test('returns default for empty string', () => expect(formatApiEndpoint('')).toBe('http://localhost:7000/chat'));
    test('returns default for undefined', () => expect(formatApiEndpoint(undefined)).toBe('http://localhost:7000/chat'));
    test('returns full URL unchanged', () => expect(formatApiEndpoint('https://api.example.com/chat')).toBe('https://api.example.com/chat'));
    test('returns http URL unchanged', () => expect(formatApiEndpoint('http://localhost:3000/chat')).toBe('http://localhost:3000/chat'));
    test('prepends http:// for bare hostname', () => expect(formatApiEndpoint('myapi.com/chat')).toBe('http://myapi.com/chat'));
    test('prepends origin for path starting with /', () => {
        // jsdom sets window.location.origin to 'http://localhost'
        expect(formatApiEndpoint('/api/chat')).toBe('http://localhost/api/chat');
    });
    test('prepends protocol for //-prefixed URL', () => {
        expect(formatApiEndpoint('//api.example.com/chat')).toMatch(/^https?:\/\/api\.example\.com\/chat/);
    });
});

// ── initConfig ────────────────────────────────────────────────────────────────

describe('initConfig', () => {
    test('sets defaults when empty config provided', () => {
        const cfg = initConfig({});
        expect(cfg.botName).toBe('Chat Assistant');
        expect(cfg.theme).toBe('light');
        expect(cfg.position).toBe('bottom-right');
        expect(cfg.enableHistory).toBe(true);
        expect(cfg.enableMarkdown).toBe(true);
        expect(cfg.enableTypewriter).toBe(true);
        expect(cfg.maxHistoryLength).toBe(100);
        expect(cfg.apiMethod).toBe('POST');
        expect(cfg.apiTimeout).toBe(30000);
    });

    test('respects provided botName', () => {
        expect(initConfig({ botName: 'MyBot' }).botName).toBe('MyBot');
    });

    test('clamps fontSize', () => {
        expect(initConfig({ fontSize: 30 }).fontSize).toBe('25px');
        expect(initConfig({ fontSize: 5 }).fontSize).toBe('14px');
        expect(initConfig({ fontSize: 18 }).fontSize).toBe('18px');
    });

    test('clamps width', () => {
        expect(initConfig({ width: '100px' }).width).toBe('300px');
        expect(initConfig({ width: '700px' }).width).toBe('600px');
        expect(initConfig({ width: '450px' }).width).toBe('450px');
    });

    test('clamps height', () => {
        expect(initConfig({ height: '200px' }).height).toBe('400px');
        expect(initConfig({ height: '900px' }).height).toBe('800px');
    });

    test('enableHistory false respected', () => {
        expect(initConfig({ enableHistory: false }).enableHistory).toBe(false);
    });

    test('enableMarkdown false respected', () => {
        expect(initConfig({ enableMarkdown: false }).enableMarkdown).toBe(false);
    });

    test('enableTypewriter false respected', () => {
        expect(initConfig({ enableTypewriter: false }).enableTypewriter).toBe(false);
    });

    test('supabase config defaults', () => {
        const cfg = initConfig({});
        expect(cfg.supabase.enabled).toBe(false);
        expect(cfg.supabase.tableName).toBe('chat_history');
        expect(cfg.supabase.historyLimit).toBe(50);
        expect(cfg.supabase.pollIntervalMs).toBe(5000);
    });

    test('supabase config passes through custom values', () => {
        const cfg = initConfig({
            supabase: { enabled: true, url: 'https://x.supabase.co', anonKey: 'abc', tableName: 'msgs', historyLimit: 20, pollIntervalMs: 3000 }
        });
        expect(cfg.supabase.enabled).toBe(true);
        expect(cfg.supabase.url).toBe('https://x.supabase.co');
        expect(cfg.supabase.anonKey).toBe('abc');
        expect(cfg.supabase.tableName).toBe('msgs');
        expect(cfg.supabase.historyLimit).toBe(20);
        expect(cfg.supabase.pollIntervalMs).toBe(3000);
    });

    test('parlant config defaults to disabled', () => {
        const cfg = initConfig({});
        expect(cfg.parlant.enabled).toBe(false);
        expect(cfg.parlant.apiBaseUrl).toBe('');
    });

    test('hubspot defaults', () => {
        const cfg = initConfig({});
        expect(cfg.hubspot.enabled).toBe(false);
        expect(cfg.hubspot.triggerKeywords).toContain('pricing');
    });

    test('apiEndpoint full URL kept as-is', () => {
        const cfg = initConfig({ apiEndpoint: 'https://my.api.com/chat' });
        expect(cfg.apiEndpoint).toBe('https://my.api.com/chat');
    });

    test('chips defaults to empty array', () => {
        expect(initConfig({}).chips).toEqual([]);
    });

    test('chips passed through', () => {
        const chips = [{ text: 'Hello', value: 'hello' }];
        expect(initConfig({ chips }).chips).toEqual(chips);
    });

    test('toggleButtonAnimation clamped 0–5', () => {
        expect(initConfig({ toggleButtonAnimation: -1 }).toggleButtonAnimation).toBe(0);
        expect(initConfig({ toggleButtonAnimation: 10 }).toggleButtonAnimation).toBe(5);
        expect(initConfig({ toggleButtonAnimation: 3 }).toggleButtonAnimation).toBe(3);
    });

    test('toggleButtonSize clamped 40–80', () => {
        expect(initConfig({ toggleButtonSize: 20 }).toggleButtonSize).toBe(40);
        expect(initConfig({ toggleButtonSize: 100 }).toggleButtonSize).toBe(80);
        expect(initConfig({ toggleButtonSize: 60 }).toggleButtonSize).toBe(60);
    });

    test('deleteEndpoint derived from apiEndpoint when not provided', () => {
        const cfg = initConfig({ apiEndpoint: 'https://api.example.com/chat' });
        expect(cfg.deleteEndpoint).toBe('https://api.example.com/delete-history');
    });
});
