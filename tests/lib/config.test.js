/**
 * Tests for src/lib/config.js
 * clampDimension and clampFontSize are private helpers tested indirectly via initConfig.
 * formatApiEndpoint is also private — tested indirectly.
 */

const { initConfig } = require('../../src/lib/config.js');

// ── clampDimension (via initConfig width/height) ──────────────────────────────

describe('clampDimension (via initConfig)', () => {
    test('returns value within range', () => expect(initConfig({ width: '400px' }).width).toBe('400px'));
    test('clamps below min', () => expect(initConfig({ width: '200px' }).width).toBe('300px'));
    test('clamps above max', () => expect(initConfig({ width: '800px' }).width).toBe('600px'));
    test('accepts number string without px', () => expect(initConfig({ width: '500' }).width).toBe('500px'));
    test('clamps zero to min', () => expect(initConfig({ width: '0' }).width).toBe('300px'));
    test('handles exact min', () => expect(initConfig({ width: '300px' }).width).toBe('300px'));
    test('handles exact max', () => expect(initConfig({ width: '600px' }).width).toBe('600px'));
    test('handles non-numeric gracefully (defaults to 0 → clamps to min)', () => {
        expect(initConfig({ width: 'abc' }).width).toBe('300px');
    });
});

// ── clampFontSize (via initConfig fontSize) ───────────────────────────────────

describe('clampFontSize (via initConfig)', () => {
    test('returns 14px for 14', () => expect(initConfig({ fontSize: 14 }).fontSize).toBe('14px'));
    test('returns 25px for 25', () => expect(initConfig({ fontSize: 25 }).fontSize).toBe('25px'));
    test('returns 18px for "18px" string', () => expect(initConfig({ fontSize: '18px' }).fontSize).toBe('18px'));
    test('clamps below 14 to 14px', () => expect(initConfig({ fontSize: 10 }).fontSize).toBe('14px'));
    test('clamps above 25 to 25px', () => expect(initConfig({ fontSize: 30 }).fontSize).toBe('25px'));
    test('defaults to 14px for non-numeric type', () => expect(initConfig({ fontSize: null }).fontSize).toBe('14px'));
    test('accepts number as string', () => expect(initConfig({ fontSize: '20' }).fontSize).toBe('20px'));
    test('clamps string too-small', () => expect(initConfig({ fontSize: '10px' }).fontSize).toBe('14px'));
    test('clamps string too-large', () => expect(initConfig({ fontSize: '30px' }).fontSize).toBe('25px'));
});

// ── formatApiEndpoint (via initConfig apiEndpoint) ────────────────────────────

describe('formatApiEndpoint (via initConfig)', () => {
    test('returns default for null', () => expect(initConfig({ apiEndpoint: null }).apiEndpoint).toBe('http://localhost:7000/chat'));
    test('returns default for empty string', () => expect(initConfig({ apiEndpoint: '' }).apiEndpoint).toBe('http://localhost:7000/chat'));
    test('returns default for undefined', () => expect(initConfig({}).apiEndpoint).toBe('http://localhost:7000/chat'));
    test('returns full URL unchanged', () => expect(initConfig({ apiEndpoint: 'https://api.example.com/chat' }).apiEndpoint).toBe('https://api.example.com/chat'));
    test('returns http URL unchanged', () => expect(initConfig({ apiEndpoint: 'http://localhost:3000/chat' }).apiEndpoint).toBe('http://localhost:3000/chat'));
    test('prepends http:// for bare hostname', () => expect(initConfig({ apiEndpoint: 'myapi.com/chat' }).apiEndpoint).toBe('http://myapi.com/chat'));
    test('prepends origin for path starting with /', () => {
        expect(initConfig({ apiEndpoint: '/api/chat' }).apiEndpoint).toBe('http://localhost/api/chat');
    });
    test('prepends protocol for //-prefixed URL', () => {
        expect(initConfig({ apiEndpoint: '//api.example.com/chat' }).apiEndpoint).toMatch(/^https?:\/\/api\.example\.com\/chat/);
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
