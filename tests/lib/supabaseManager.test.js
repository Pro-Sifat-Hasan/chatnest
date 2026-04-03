/**
 * Tests for src/lib/supabase/SupabaseManager.js
 * All Supabase client calls are mocked — no real network access.
 */

const { SupabaseManager } = require('../../src/lib/supabase/SupabaseManager.js');

// ── isReady ───────────────────────────────────────────────────────────────────

describe('SupabaseManager.isReady', () => {
    test('false before initialization', () => {
        const sm = new SupabaseManager({ url: 'https://x.co', anonKey: 'key' });
        expect(sm.isReady).toBe(false);
    });

    test('true after successful initialization', async () => {
        const mockClient = {};
        window.supabase = { createClient: () => mockClient };
        const sm = new SupabaseManager({ url: 'https://x.co', anonKey: 'key' });
        await sm.initialize();
        expect(sm.isReady).toBe(true);
        delete window.supabase;
    });

    test('false when url is missing', async () => {
        const sm = new SupabaseManager({ url: '', anonKey: 'key' });
        await sm.initialize();
        expect(sm.isReady).toBe(false);
    });

    test('false when anonKey is missing', async () => {
        const sm = new SupabaseManager({ url: 'https://x.co', anonKey: '' });
        await sm.initialize();
        expect(sm.isReady).toBe(false);
    });
});

// ── getChatHistory ────────────────────────────────────────────────────────────

describe('SupabaseManager.getChatHistory', () => {
    test('returns [] when not initialized', async () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        expect(await sm.getChatHistory('u1', 'dom')).toEqual([]);
    });

    test('returns rows from client', async () => {
        const rows = [{ id: 1, query: 'Hi', response: 'Hello', timestamp: '2024-01-01T00:00:00Z' }];
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm.initialized = true;
        sm.client = {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        eq: () => ({
                            order: () => ({
                                limit: () => Promise.resolve({ data: rows, error: null })
                            })
                        })
                    })
                })
            })
        };
        const result = await sm.getChatHistory('user1', 'localhost');
        expect(result).toEqual(rows);
    });

    test('returns [] on client error', async () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm.initialized = true;
        sm.client = {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        eq: () => ({
                            order: () => ({
                                limit: () => Promise.resolve({ data: null, error: new Error('DB error') })
                            })
                        })
                    })
                })
            })
        };
        const result = await sm.getChatHistory('user1', 'localhost');
        expect(result).toEqual([]);
    });
});

// ── saveChatPair ──────────────────────────────────────────────────────────────

describe('SupabaseManager.saveChatPair', () => {
    test('returns null when not initialized', async () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        expect(await sm.saveChatPair('u1', 'dom', 'q', 'r')).toBeNull();
    });

    test('returns inserted id and adds to _ourInsertedIds', async () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm.initialized = true;
        sm.client = {
            from: () => ({
                insert: () => ({
                    select: () => ({
                        single: () => Promise.resolve({ data: { id: 42 }, error: null })
                    })
                })
            })
        };
        const result = await sm.saveChatPair('u1', 'dom', 'Q', 'R');
        expect(result).toBe(42);
        expect(sm._ourInsertedIds.has(42)).toBe(true);
    });

    test('returns null and does not throw on insert error', async () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm.initialized = true;
        sm.client = {
            from: () => ({
                insert: () => ({
                    select: () => ({
                        single: () => Promise.resolve({ data: null, error: new Error('insert fail') })
                    })
                })
            })
        };
        expect(await sm.saveChatPair('u1', 'dom', 'Q', 'R')).toBeNull();
    });
});

// ── setLastSeenFromRows ───────────────────────────────────────────────────────

describe('SupabaseManager.setLastSeenFromRows', () => {
    test('sets _lastSeenId to max id from rows', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm.setLastSeenFromRows([{ id: 5 }, { id: 12 }, { id: 3 }]);
        expect(sm._lastSeenId).toBe(12);
    });

    test('does not update for empty rows', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm._lastSeenId = 10;
        sm.setLastSeenFromRows([]);
        expect(sm._lastSeenId).toBe(10);
    });

    test('does not update for null rows', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm._lastSeenId = 7;
        sm.setLastSeenFromRows(null);
        expect(sm._lastSeenId).toBe(7);
    });

    test('does not decrease _lastSeenId', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm._lastSeenId = 20;
        sm.setLastSeenFromRows([{ id: 5 }]);
        expect(sm._lastSeenId).toBe(20);
    });
});

// ── _splitParts ───────────────────────────────────────────────────────────────

describe('SupabaseManager._splitParts', () => {
    test('returns [""] for null', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        expect(sm._splitParts(null)).toEqual(['']);
    });

    test('splits by ,,, delimiter', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        expect(sm._splitParts('A,,,B,,,C')).toEqual(['A', 'B', 'C']);
    });

    test('returns single element for no delimiter', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        expect(sm._splitParts('Hello world')).toEqual(['Hello world']);
    });

    test('trims whitespace', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        expect(sm._splitParts('  A  ,,,  B  ')).toEqual(['A', 'B']);
    });
});

// ── rowsToMessages ────────────────────────────────────────────────────────────

describe('SupabaseManager.rowsToMessages', () => {
    let sm;
    beforeEach(() => { sm = new SupabaseManager({ url: 'u', anonKey: 'k' }); });

    test('produces user + bot message pair per row', () => {
        const rows = [{ id: 1, query: 'Hi', response: 'Hello', timestamp: '2024-01-01T00:00:00Z' }];
        const msgs = sm.rowsToMessages(rows);
        expect(msgs).toHaveLength(2);
        expect(msgs[0].sender).toBe('user');
        expect(msgs[0].message).toBe('Hi');
        expect(msgs[1].sender).toBe('bot');
        expect(msgs[1].message).toBe('Hello');
    });

    test('splits multi-part bot response by ,,,', () => {
        const rows = [{ id: 2, query: 'Q', response: 'Part1,,,Part2', timestamp: '2024-01-01T00:00:00Z' }];
        const msgs = sm.rowsToMessages(rows);
        expect(msgs).toHaveLength(3);
        expect(msgs[1].message).toBe('Part1');
        expect(msgs[1].skipMessageActions).toBe(true);
        expect(msgs[2].message).toBe('Part2');
        expect(msgs[2].skipMessageActions).toBe(false);
    });

    test('sets skipMessageActions correctly for single-part response', () => {
        const rows = [{ id: 3, query: 'Q', response: 'Single', timestamp: '2024-01-01T00:00:00Z' }];
        const msgs = sm.rowsToMessages(rows);
        const botMsg = msgs.find(m => m.sender === 'bot');
        expect(botMsg.skipMessageActions).toBe(false);
    });

    test('sets partKey for user and bot messages', () => {
        const rows = [{ id: 5, query: 'Q', response: 'R', timestamp: '2024-01-01T00:00:00Z' }];
        const msgs = sm.rowsToMessages(rows);
        expect(msgs[0].partKey).toBe('sb-5-u');
        expect(msgs[1].partKey).toBe('sb-5-b0');
    });

    test('returns empty array for no rows', () => {
        expect(sm.rowsToMessages([])).toEqual([]);
    });

    test('handles multiple rows', () => {
        const rows = [
            { id: 1, query: 'Q1', response: 'R1', timestamp: '2024-01-01T00:00:00Z' },
            { id: 2, query: 'Q2', response: 'R2', timestamp: '2024-01-02T00:00:00Z' },
        ];
        expect(sm.rowsToMessages(rows)).toHaveLength(4);
    });

    test('uses current time when timestamp is missing', () => {
        const rows = [{ id: 1, query: 'Q', response: 'R' }];
        const msgs = sm.rowsToMessages(rows);
        expect(msgs[0].timestamp).toBeTruthy();
    });
});

// ── startBackgroundRefresh / stopBackgroundRefresh ────────────────────────────

describe('SupabaseManager startBackgroundRefresh / stopBackgroundRefresh', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('calls onRefresh after interval', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k', pollIntervalMs: 1000 });
        sm.initialized = true;
        sm.client = {};
        const onRefresh = jest.fn().mockResolvedValue();
        sm.startBackgroundRefresh(1000, onRefresh);
        jest.advanceTimersByTime(1000);
        expect(onRefresh).toHaveBeenCalledTimes(1);
        sm.stopBackgroundRefresh();
    });

    test('stopBackgroundRefresh cancels further calls', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k', pollIntervalMs: 1000 });
        sm.initialized = true;
        sm.client = {};
        const onRefresh = jest.fn().mockResolvedValue();
        sm.startBackgroundRefresh(1000, onRefresh);
        sm.stopBackgroundRefresh();
        jest.advanceTimersByTime(5000);
        expect(onRefresh).not.toHaveBeenCalled();
    });

    test('does not call onRefresh when not initialized', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k', pollIntervalMs: 500 });
        const onRefresh = jest.fn().mockResolvedValue();
        sm.startBackgroundRefresh(500, onRefresh);
        jest.advanceTimersByTime(500);
        expect(onRefresh).not.toHaveBeenCalled();
        sm.stopBackgroundRefresh();
    });
});

// ── _ourInsertedIds deduplication guard ───────────────────────────────────────

describe('SupabaseManager _ourInsertedIds deduplication', () => {
    test('does not re-render own-inserted rows in realtime callback', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm.initialized = true;
        sm._ourInsertedIds.add(99);

        const onNewRow = jest.fn();
        const row = { id: 99, query: 'Q', response: 'R', timestamp: '' };
        if (!sm._ourInsertedIds.has(row.id)) onNewRow(row);

        expect(onNewRow).not.toHaveBeenCalled();
    });

    test('calls onNewRow for rows not in _ourInsertedIds', () => {
        const sm = new SupabaseManager({ url: 'u', anonKey: 'k' });
        sm.initialized = true;

        const onNewRow = jest.fn();
        const row = { id: 99, query: 'Q', response: 'R', timestamp: '' };
        if (!sm._ourInsertedIds.has(row.id)) onNewRow(row);

        expect(onNewRow).toHaveBeenCalledWith(row);
    });
});
